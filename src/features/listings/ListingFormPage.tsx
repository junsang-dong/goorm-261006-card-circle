import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Field, StackHeader, fieldClass } from '../../components/ui'
import { DomainError } from '../../lib/errors'
import { compressImageFile } from '../../lib/images'
import { conditionLabel, methodLabel, sportLabel, transactionLabel } from '../../lib/labels'
import { formatAskingPrice } from '../../lib/format'
import { listingById } from '../../lib/query'
import { useStore } from '../../lib/store'
import type { Condition, GradeStatus, ListingInput, MeetupMethod, Sport, TransactionType } from '../../types'
import { emptyListingInput, errorsForStep, listingToInput, validateListingInput } from '../../lib/validate'

const steps = ['사진', '카드 정보', '상태', '거래 조건', '미리보기']

export function ListingFormRoute() {
  const { id } = useParams()
  return <ListingFormPage key={id ?? 'new'} />
}

function ListingFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()
  const existing = id ? listingById(state, id) : undefined
  const [step, setStep] = useState(1)
  const [input, setInput] = useState<ListingInput>(() => (existing ? listingToInput(existing) : emptyListingInput()))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  if (id && !existing) {
    return (
      <div>
        <StackHeader title="카드 수정" onBack={() => navigate('/')} />
        <p className="px-4 py-8 text-sm">매물을 찾을 수 없습니다.</p>
      </div>
    )
  }
  if (existing && existing.ownerId !== state.currentUserId) {
    return (
      <div>
        <StackHeader title="카드 수정" onBack={() => navigate(-1)} />
        <p className="px-4 py-8 text-sm">본인 매물만 수정할 수 있습니다.</p>
      </div>
    )
  }
  if (existing && existing.status !== 'available') {
    return (
      <div>
        <StackHeader title="카드 수정" onBack={() => navigate(-1)} />
        <p className="px-4 py-8 text-sm">예약·완료·철회된 매물은 수정할 수 없습니다.</p>
      </div>
    )
  }

  const patch = (partial: Partial<ListingInput>) => setInput((current) => ({ ...current, ...partial }))

  const goNext = () => {
    const nextErrors = errorsForStep(input, step)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) setStep((current) => Math.min(5, current + 1))
  }

  const submit = () => {
    const result = validateListingInput(input)
    if (!result.ok) {
      setErrors(result.fields)
      setFormError('필수 항목을 확인해 주세요.')
      return
    }
    setFormError(null)
    try {
      if (existing) {
        dispatch({ type: 'update-listing', listingId: existing.id, version: existing.version, input })
        navigate(`/listings/${existing.id}`)
        return
      }
      const before = new Set(state.listings.map((listing) => listing.id))
      const next = dispatch({ type: 'create-listing', input })
      const created = next.listings.find((listing) => !before.has(listing.id))
      navigate(created ? `/listings/${created.id}` : '/')
    } catch (caught) {
      if (caught instanceof DomainError) {
        setErrors(caught.fields ?? {})
        setFormError(caught.message)
      } else setFormError('저장하지 못했습니다.')
    }
  }

  return (
    <div className="pb-28">
      <StackHeader title={existing ? '카드 수정' : '카드 등록'} onBack={() => (step > 1 ? setStep(step - 1) : navigate(-1))} />
      <div className="px-4 pt-4">
        <p className="text-[11px] font-bold tracking-wide text-primary">
          {step} / 5 {steps[step - 1]}
        </p>
        <h2 className="text-base font-semibold">사진, 상태, 희망 조건을 직접 입력합니다.</h2>
        <div className="mt-3 grid grid-cols-5 gap-1" aria-hidden="true">
          {steps.map((label, index) => (
            <span key={label} className={`h-1.5 rounded-full ${index < step ? 'bg-primary-container' : 'bg-surface-container-high'}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {step === 1 ? <PhotoStep input={input} errors={errors} uploading={uploading} setUploading={setUploading} patch={patch} setFormError={setFormError} /> : null}
        {step === 2 ? <InfoStep input={input} errors={errors} patch={patch} /> : null}
        {step === 3 ? <ConditionStep input={input} errors={errors} patch={patch} /> : null}
        {step === 4 ? <TradeStep input={input} errors={errors} patch={patch} /> : null}
        {step === 5 ? <Preview input={input} /> : null}
        {formError ? (
          <p role="alert" className="text-sm font-semibold text-error">
            {formError}
          </p>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[480px] -translate-x-1/2 gap-2 border-t border-surface-container bg-white px-4 py-3">
        {step > 1 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            이전
          </Button>
        ) : null}
        {step < 5 ? (
          <Button className="flex-1" onClick={goNext} disabled={uploading}>
            다음
          </Button>
        ) : (
          <Button className="flex-1" onClick={submit}>
            {existing ? '수정 저장' : '등록하기'}
          </Button>
        )}
      </div>
    </div>
  )
}

function PhotoStep({
  input,
  errors,
  uploading,
  setUploading,
  patch,
  setFormError,
}: {
  input: ListingInput
  errors: Record<string, string>
  uploading: boolean
  setUploading: (value: boolean) => void
  patch: (partial: Partial<ListingInput>) => void
  setFormError: (value: string | null) => void
}) {
  const replaceAt = async (index: number, file: File | undefined) => {
    if (!file) return
    setFormError(null)
    setUploading(true)
    try {
      const dataUrl = await compressImageFile(file)
      const images = [...input.images]
      while (images.length < index) images.push('')
      images[index] = dataUrl
      patch({ images: images.slice(0, 5) })
    } catch (caught) {
      setFormError(caught instanceof DomainError ? caught.message : '사진을 올리지 못했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold">사진</h3>
        <span className="text-xs text-on-surface-variant">앞·뒷면 필수, 최대 5장</span>
      </div>
      <p className="text-xs text-on-surface-variant">모서리와 표면이 보이게 찍어 주세요. JPEG, PNG, WebP만 올리며 긴 변 1600px, 1.5MB 이하로 줄입니다.</p>
      <div className="grid grid-cols-3 gap-2">
        <PhotoSlot label="앞면" image={input.images[0]} onFile={(file) => replaceAt(0, file)} />
        <PhotoSlot label="뒷면" image={input.images[1]} onFile={(file) => replaceAt(1, file)} />
        {input.images.slice(2).map((image, extraIndex) => (
          <PhotoSlot
            key={image.slice(0, 24) + extraIndex}
            label={`추가 ${extraIndex + 1}`}
            image={image}
            onFile={(file) => replaceAt(extraIndex + 2, file)}
            onRemove={() => patch({ images: input.images.filter((_, index) => index !== extraIndex + 2) })}
          />
        ))}
        {input.images.filter(Boolean).length < 5 && input.images[0] && input.images[1] ? (
          <PhotoSlot label="추가 사진" onFile={(file) => replaceAt(input.images.length, file)} />
        ) : null}
      </div>
      {errors.images ? (
        <p role="alert" className="text-xs font-semibold text-error">
          {errors.images}
        </p>
      ) : null}
      {uploading ? <p className="text-xs">사진을 줄이는 중입니다.</p> : null}
      <label className="flex items-start gap-2 rounded-xl bg-surface-container-low p-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={input.ownershipConfirmed}
          onChange={(event) => patch({ ownershipConfirmed: event.target.checked })}
        />
        <span>내가 보유하고 있고 등록할 권리가 있는 실물 카드를 직접 촬영했습니다.</span>
      </label>
      {errors.ownershipConfirmed ? (
        <p role="alert" className="text-xs font-semibold text-error">
          {errors.ownershipConfirmed}
        </p>
      ) : null}
    </section>
  )
}

function PhotoSlot({ label, image, onFile, onRemove }: { label: string; image?: string; onFile: (file: File | undefined) => void; onRemove?: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-label={`${label} 사진 선택`}
        onClick={() => ref.current?.click()}
        className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-surface-container text-xs font-semibold"
      >
        {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : '올리기'}
        <span className="absolute top-1 left-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">{label}</span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={`${label} 사진 선택`}
        onChange={(event) => {
          onFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {onRemove ? (
        <button type="button" className="text-xs font-semibold text-error" onClick={onRemove}>
          삭제
        </button>
      ) : null}
    </div>
  )
}

function InfoStep({ input, errors, patch }: StepProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">카드 정보</h3>
      <Field label="제목" htmlFor="title" error={errors.title}>
        <input id="title" className={fieldClass} maxLength={100} value={input.title} aria-invalid={Boolean(errors.title)} onChange={(event) => patch({ title: event.target.value })} />
      </Field>
      <Field label="종목" htmlFor="sport" error={errors.sport}>
        <select id="sport" className={fieldClass} value={input.sport} onChange={(event) => patch({ sport: event.target.value as Sport | '' })}>
          <option value="">선택</option>
          {(Object.keys(sportLabel) as Sport[]).map((sport) => (
            <option key={sport} value={sport}>
              {sportLabel[sport]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="선수·인물" htmlFor="player" error={errors.player}>
        <input id="player" className={fieldClass} maxLength={100} value={input.player} onChange={(event) => patch({ player: event.target.value })} />
      </Field>
      <Field label="제조사" htmlFor="manufacturer" error={errors.manufacturer}>
        <input id="manufacturer" className={fieldClass} maxLength={100} value={input.manufacturer} onChange={(event) => patch({ manufacturer: event.target.value })} />
      </Field>
      <Field label="세트" htmlFor="setName" error={errors.setName}>
        <input id="setName" className={fieldClass} maxLength={100} value={input.setName} onChange={(event) => patch({ setName: event.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="발행 연도" htmlFor="year" error={errors.year}>
          <input id="year" inputMode="numeric" className={fieldClass} maxLength={4} value={input.year} onChange={(event) => patch({ year: event.target.value })} />
        </Field>
        <Field label="카드 번호" htmlFor="cardNumber" hint="앞자리 0을 유지합니다." error={errors.cardNumber}>
          <input id="cardNumber" className={fieldClass} maxLength={50} value={input.cardNumber} onChange={(event) => patch({ cardNumber: event.target.value })} />
        </Field>
      </div>
      <Field label="패러렐·판본·언어" htmlFor="parallel" error={errors.parallel}>
        <input id="parallel" className={fieldClass} maxLength={100} value={input.parallel} onChange={(event) => patch({ parallel: event.target.value })} />
      </Field>
    </section>
  )
}

function ConditionStep({ input, errors, patch }: StepProps) {
  const conditions: Condition[] = ['near_mint', 'good', 'played', 'damaged']
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">상태</h3>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold text-on-surface-variant">등록자 평가</legend>
        {conditions.map((condition) => (
          <label key={condition} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-outline-variant/70">
            <input type="radio" name="condition" checked={input.condition === condition} onChange={() => patch({ condition })} />
            {conditionLabel[condition]}
          </label>
        ))}
        {errors.condition ? (
          <p role="alert" className="text-xs font-semibold text-error">
            {errors.condition}
          </p>
        ) : null}
      </fieldset>
      <Field label="상태·하자 설명" htmlFor="conditionNote" error={errors.conditionNote} hint={`${input.conditionNote.trim().length} / 2000`}>
        <textarea
          id="conditionNote"
          className={`${fieldClass} h-28 py-2`}
          maxLength={2000}
          value={input.conditionNote}
          onChange={(event) => patch({ conditionNote: event.target.value })}
        />
      </Field>
      <fieldset className="flex gap-2">
        <legend className="sr-only">등급 평가 여부</legend>
        {(['ungraded', 'graded'] as GradeStatus[]).map((gradeStatus) => (
          <label key={gradeStatus} className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-outline-variant/70">
            <input
              type="radio"
              name="gradeStatus"
              checked={input.gradeStatus === gradeStatus}
              onChange={() => patch({ gradeStatus, grader: gradeStatus === 'ungraded' ? '' : input.grader, grade: gradeStatus === 'ungraded' ? '' : input.grade })}
            />
            {gradeStatus === 'graded' ? '등급 있음' : '등급 없음'}
          </label>
        ))}
      </fieldset>
      {input.gradeStatus === 'graded' ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label="감정기관" htmlFor="grader" error={errors.grader} hint="등록자 입력이며 앱이 확인하지 않습니다.">
            <input id="grader" className={fieldClass} maxLength={50} value={input.grader} onChange={(event) => patch({ grader: event.target.value })} />
          </Field>
          <Field label="등급" htmlFor="grade" error={errors.grade}>
            <input id="grade" className={fieldClass} maxLength={20} value={input.grade} onChange={(event) => patch({ grade: event.target.value })} />
          </Field>
        </div>
      ) : null}
      <Field label="인증번호" htmlFor="certNumber" error={errors.certNumber} hint="있어도 앱의 진품 확인은 아닙니다.">
        <input id="certNumber" className={fieldClass} maxLength={50} value={input.certNumber} onChange={(event) => patch({ certNumber: event.target.value })} />
      </Field>
    </section>
  )
}

function TradeStep({ input, errors, patch }: StepProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">거래 조건</h3>
      <Field label="거래 유형" htmlFor="transactionType" error={errors.transactionType}>
        <select
          id="transactionType"
          className={fieldClass}
          value={input.transactionType}
          onChange={(event) => {
            const transactionType = event.target.value as TransactionType | ''
            patch({
              transactionType,
              askingPrice: transactionType === 'giveaway' ? '0' : transactionType === 'trade' ? '' : input.askingPrice,
            })
          }}
        >
          {(Object.keys(transactionLabel) as TransactionType[]).map((type) => (
            <option key={type} value={type}>
              {transactionLabel[type]}
            </option>
          ))}
        </select>
      </Field>
      {input.transactionType === 'sale' ? (
        <Field label="희망 가격 (원)" htmlFor="askingPrice" error={errors.askingPrice} hint="등록자 희망 가격입니다.">
          <input id="askingPrice" inputMode="numeric" className={fieldClass} value={input.askingPrice} onChange={(event) => patch({ askingPrice: event.target.value })} />
        </Field>
      ) : null}
      {input.transactionType === 'giveaway' ? <p className="text-sm">나눔 가격은 ₩0입니다.</p> : null}
      {input.transactionType === 'trade' ? (
        <Field label="교환 희망 조건" htmlFor="tradeWish" error={errors.tradeWish}>
          <textarea id="tradeWish" className={`${fieldClass} h-24 py-2`} maxLength={1000} value={input.tradeWish} onChange={(event) => patch({ tradeWish: event.target.value })} />
        </Field>
      ) : null}
      <Field label="거래 방법" htmlFor="method" error={errors.method}>
        <select id="method" className={fieldClass} value={input.method} onChange={(event) => patch({ method: event.target.value as MeetupMethod | '' })}>
          {(Object.keys(methodLabel) as MeetupMethod[]).map((method) => (
            <option key={method} value={method}>
              {methodLabel[method]}
            </option>
          ))}
        </select>
      </Field>
      {input.method === 'meetup' || input.method === 'both' ? (
        <Field label="직거래 지역" htmlFor="meetupArea" error={errors.meetupArea} hint="시·구만 입력하고 상세 주소는 적지 마세요.">
          <input id="meetupArea" className={fieldClass} maxLength={40} value={input.meetupArea} onChange={(event) => patch({ meetupArea: event.target.value })} />
        </Field>
      ) : null}
      <Field label="배송비 (원)" htmlFor="shippingFee" error={errors.shippingFee} hint="비워 두면 별도 협의, 무료는 0입니다.">
        <input id="shippingFee" inputMode="numeric" className={fieldClass} value={input.shippingFee} onChange={(event) => patch({ shippingFee: event.target.value })} />
      </Field>
    </section>
  )
}

function Preview({ input }: { input: ListingInput }) {
  const parsed = validateListingInput(input)
  if (!parsed.ok) return <p className="text-sm text-error">미리보기 전에 입력 오류를 고쳐 주세요.</p>
  const value = parsed.value
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">미리보기</h3>
      <div className="grid grid-cols-2 gap-2">
        {value.images.map((src, index) => (
          <img key={src.slice(0, 32) + index} src={src} alt={`${value.title} 미리보기 ${index + 1}`} className="aspect-[4/5] w-full rounded-xl object-cover" />
        ))}
      </div>
      <p className="text-lg font-bold">{value.title}</p>
      <p className="text-xl font-extrabold text-primary tabular-nums">{formatAskingPrice(value.transactionType, value.askingPrice)}</p>
      <p className="text-sm text-on-surface-variant">
        {sportLabel[value.sport]} · {value.player} · {conditionLabel[value.condition]} · {methodLabel[value.method]}
      </p>
      <p className="rounded-xl bg-surface-container p-3 text-xs leading-5">가격과 상태는 등록자가 입력한 내용으로 저장됩니다.</p>
    </section>
  )
}

type StepProps = {
  input: ListingInput
  errors: Record<string, string>
  patch: (partial: Partial<ListingInput>) => void
}
