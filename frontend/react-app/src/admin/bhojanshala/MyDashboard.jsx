import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { adminApi } from '../../lib/api'
import AvailabilityCalendar from './AvailabilityCalendar'

// ─── Image compression ────────────────────────────────────────────
async function compressImage(file, maxPx = 1200, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ─── Primitive components ─────────────────────────────────────────

function GujToggle({ checked, onChange }) {
  return (
    <label className="gj-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="gj-toggle-track" />
      <span className="gj-toggle-thumb" />
    </label>
  )
}

function GujSection({ title, hint, children }) {
  return (
    <div className="gj-section">
      <div className="gj-section-head">
        <div className="gj-section-title">{title}</div>
        {hint && <div className="gj-section-hint">{hint}</div>}
      </div>
      <div className="gj-section-body">{children}</div>
    </div>
  )
}

function GujField({ label, children, full }) {
  return (
    <div className="gj-field" style={full ? { gridColumn: '1 / -1' } : {}}>
      {label && <label className="gj-label">{label}</label>}
      {children}
    </div>
  )
}

// ─── Image slot (single photo) ────────────────────────────────────

function ImageSlot({ value, onChange, label }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await compressImage(file)
      onChange(dataUrl)
    } catch (err) {
      console.error('Image compress error:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="gj-photo-slot">
      {label && <span className="gj-photo-label">{label}</span>}
      {value ? (
        <div className="gj-photo-preview">
          <img src={value} alt={label || 'photo'} />
          <button className="gj-photo-remove" onClick={() => onChange('')} title="Remove">×</button>
        </div>
      ) : (
        <button
          className="gj-photo-add"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <span className="gj-photo-icon">📸</span>
          {uploading ? 'અપલોડ...' : 'ફોટો ઉમેરો'}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  )
}

// ─── Gallery (multiple extra photos) ─────────────────────────────

function GallerySlots({ photos, onChange, max = 5 }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await compressImage(file)
      onChange([...photos, dataUrl])
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function remove(idx) {
    onChange(photos.filter((_, i) => i !== idx))
  }

  return (
    <div className="gj-photos-grid">
      {photos.map((url, idx) => (
        <div key={idx} className="gj-photo-slot">
          <div className="gj-photo-preview">
            <img src={url} alt={`photo-${idx + 1}`} />
            <button className="gj-photo-remove" onClick={() => remove(idx)}>×</button>
          </div>
        </div>
      ))}
      {photos.length < max && (
        <div className="gj-photo-slot">
          <button className="gj-photo-add" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <span className="gj-photo-icon">📸</span>
            {uploading ? 'અપલોડ...' : 'ફોટો ઉમેરો'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  )
}

// ─── Location picker ──────────────────────────────────────────────

function LocationPicker({ lat, lng, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState('')

  function getGPS() {
    if (!navigator.geolocation) { setErr('GPS ઉપલબ્ધ નથી'); return }
    setBusy(true); setErr('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setBusy(false)
      },
      () => { setErr('સ્થાન મળ્યું નહીં. ફરી પ્રયાસ કરો.'); setBusy(false) },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  const hasLoc = lat && lng

  return (
    <div>
      <button className="gj-loc-btn" onClick={getGPS} disabled={busy}>
        📍 {busy ? 'સ્થાન શોધી રહ્યા છીએ...' : 'હાલનું સ્થાન મેળવો (GPS)'}
      </button>

      {err && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{err}</div>}

      {hasLoc && (
        <>
          <div className="gj-loc-coords">
            📍 {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </div>
          <iframe
            title="Location Map"
            className="gj-map-frame"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.012},${Number(lat) - 0.012},${Number(lng) + 0.012},${Number(lat) + 0.012}&layer=mapnik&marker=${Number(lat)},${Number(lng)}`}
            loading="lazy"
          />
        </>
      )}

      <div className="gj-grid-2" style={{ marginTop: 8 }}>
        <div className="gj-field">
          <label className="gj-label" style={{ fontSize: 12 }}>Latitude</label>
          <input className="gj-input" type="number" step="0.000001" placeholder="23.0225"
            value={lat || ''}
            onChange={e => onChange({ lat: e.target.value, lng })} />
        </div>
        <div className="gj-field">
          <label className="gj-label" style={{ fontSize: 12 }}>Longitude</label>
          <input className="gj-input" type="number" step="0.000001" placeholder="72.5714"
            value={lng || ''}
            onChange={e => onChange({ lat, lng: e.target.value })} />
        </div>
      </div>
    </div>
  )
}

// ─── SaveFooter ───────────────────────────────────────────────────

function SaveFooter({ onSave, saving, saved, err }) {
  return (
    <div className="gj-save-footer">
      {saved && <div className="gj-save-msg success">✓ તમારી માહિતી સફળતાપૂર્વક સાચવવામાં આવી છે.</div>}
      {err   && <div className="gj-save-msg error">{err}</div>}
      <button className="gj-save-btn" onClick={onSave} disabled={saving}>
        {saving ? 'સાચવી રહ્યા છીએ...' : '💾  માહિતી સાચવો'}
      </button>
    </div>
  )
}

// ─── Bhojanshala Tab ─────────────────────────────────────────────

function BhojanshalaTab({ bhoj, onSaved }) {
  const f = bhoj // shorthand
  const [form, setForm] = useState({
    isActive:           f.isActive,
    // Contact
    phone:              f.phone              || '',
    contactPersonName:  f.contactPersonName  || '',
    alternateMobile:    f.alternateMobile    || '',
    whatsappNumber:     f.whatsappNumber     || '',
    addressGujarati:    f.addressGujarati    || '',
    description:        f.description        || '',
    // Location
    latitude:           f.latitude           ?? '',
    longitude:          f.longitude          ?? '',
    // Tiffin
    tiffinAvailable:    f.tiffin?.available  ?? false,
    tiffinType:         f.tiffin?.type       || 'OWN',
    tiffinNotes:        f.tiffin?.notes      || '',
    // Facilities
    boilWater:          f.facilities?.boilWater          ?? false,
    ekashnu:            f.facilities?.ekashnu            ?? false,
    biaasanu:           f.facilities?.biaasanu           ?? false,
    ambil:              f.facilities?.ambil              ?? false,
    parking:            f.facilities?.parking            ?? false,
    drinkingWater:      f.facilities?.drinkingWater      ?? false,
    washroom:           f.facilities?.washroom           ?? false,
    familyFriendly:     f.facilities?.familyFriendly     ?? true,
    wheelchairAccessible: f.facilities?.wheelchairAccessible ?? false,
    // Photos
    coverImage:         f.coverImage      || '',
    entranceImage:      f.entranceImage   || '',
    diningHallImage:    f.diningHallImage || '',
    images:             Array.isArray(f.images) ? f.images : [],
    // Notice
    noticeGujarati:     f.noticeGujarati || '',
    // Meal defaults (fixed daily timings & price)
    navkarshiAvailable: f.navkarshi?.available ?? true,
    navkarshiStartTime: f.navkarshi?.startTime || '',
    navkarshiEndTime:   f.navkarshi?.endTime   || '',
    navkarshiPrice:     f.navkarshi?.price     ?? 0,
    lunchAvailable:     f.lunch?.available     ?? true,
    lunchStartTime:     f.lunch?.startTime     || '',
    lunchEndTime:       f.lunch?.endTime       || '',
    lunchPrice:         f.lunch?.price         ?? 0,
    choviharAvailable:  f.chovihar?.available  ?? false,
    choviharStartTime:  f.chovihar?.startTime  || '',
    choviharEndTime:    f.chovihar?.endTime    || '',
    choviharPrice:      f.chovihar?.price      ?? 0,
    // Ayambil Shala
    ayambilShalaEnabled: f.ayambil?.available  ?? false,
    ayambilStartTime:    f.ayambil?.startTime  || '',
    ayambilEndTime:      f.ayambil?.endTime    || '',
    ayambilPrice:        f.ayambil?.price      ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [err,    setErr]    = useState('')

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  async function handleSave() {
    setSaving(true); setErr(''); setSaved(false)
    try {
      await adminApi.updateMyBhojanshala(form)
      onSaved()
      setSaved(true)
      setTimeout(() => setSaved(false), 5000)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const FACS = [
    ['boilWater',          'ઉકાળેલું પાણી'],
    ['ekashnu',            'એકાશણ'],
    ['biaasanu',           'બીઆશણ'],
    ['ambil',              'આયંબિલ'],
    ['tirth',              'તીર્થ'],
    ['parking',            'પાર્કિંગ'],
    ['drinkingWater',      'પીવાનું પાણી'],
    ['washroom',           'વૉશરૂમ'],
    ['familyFriendly',     'પરિવાર બેઠક'],
    ['wheelchairAccessible','વ્હીલચૅર'],
  ]

  const eitherActive = form.isActive || form.ayambilShalaEnabled

  return (
    <div className="gj-content">

      {/* ① Ayambil Shala toggle */}
      <div className="gj-avail-bar" style={{ marginBottom: 10 }}>
        <div>
          <div className="gj-avail-title">🥣 આયંબિલ શાળા ઉપલબ્ધ છે?</div>
          <div className="gj-avail-hint">
            {form.ayambilShalaEnabled ? '✓ આયંબિલ સેવા ઉપલબ્ધ છે' : '✗ આયંબિલ સેવા ઉપલબ્ધ નથી'}
          </div>
        </div>
        <GujToggle checked={form.ayambilShalaEnabled} onChange={v => set('ayambilShalaEnabled', v)} />
      </div>

      {/* ② Bhojanshala toggle */}
      <div className="gj-avail-bar">
        <div>
          <div className="gj-avail-title">🍛 ભોજનશાળા ઉપલબ્ધ છે?</div>
          <div className="gj-avail-hint">
            {form.isActive ? '✓ જાહેર વેબસાઇટ પર દેખાય છે' : '✗ વેબસાઇટ પર દેખાતી નથી'}
          </div>
        </div>
        <GujToggle checked={form.isActive} onChange={v => set('isActive', v)} />
      </div>

      {eitherActive && (
        <>
          {/* Basic Info */}
          <GujSection title="📋 સામાન્ય માહિતી">
            <div className="gj-grid-2">
              <GujField label="મોબાઇલ નંબર">
                <input className="gj-input" type="tel" value={form.phone}
                  placeholder="98765 43210"
                  onChange={e => set('phone', e.target.value)} />
              </GujField>
              <GujField label="સંપર્ક વ્યક્તિ">
                <input className="gj-input" value={form.contactPersonName}
                  placeholder="સ્વ. રમેશભાઈ"
                  onChange={e => set('contactPersonName', e.target.value)} />
              </GujField>
              <GujField label="વૉટ્સઍપ નંબર">
                <input className="gj-input" type="tel" value={form.whatsappNumber}
                  placeholder="98765 43210"
                  onChange={e => set('whatsappNumber', e.target.value)} />
              </GujField>
              <GujField label="બીજો મોબાઇલ">
                <input className="gj-input" type="tel" value={form.alternateMobile}
                  placeholder="98765 43211"
                  onChange={e => set('alternateMobile', e.target.value)} />
              </GujField>
              <GujField label="સરનામું" full>
                <textarea className="gj-textarea" rows={3} value={form.addressGujarati}
                  placeholder="ભોજનશાળા નું સંપૂર્ણ સરનામું..."
                  onChange={e => set('addressGujarati', e.target.value)} />
              </GujField>
              <GujField label="ભોજનશાળા વિશે" full>
                <textarea className="gj-textarea" rows={4} value={form.description}
                  placeholder="ટૂંકમાં ભોજનશાળા વિશે લખો..."
                  onChange={e => set('description', e.target.value)} />
              </GujField>
            </div>
          </GujSection>

          {/* Location */}
          <GujSection title="📍 સ્થાન (Location)">
            <LocationPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={({ lat, lng }) => setForm(p => ({ ...p, latitude: lat, longitude: lng }))}
            />
          </GujSection>

          {/* Meal Timings */}
          <GujSection title="⏰ ભોજન સમય અને કિંમત" hint="નવકારશી · આયંબિલ · બપોરે · ચોવિહાર">
            {[
              { k: 'navkarshi', icon: '☀️', label: 'નવકારશી (Navkarshi)', visibleWhen: form.isActive },
              { k: 'ayambil',   icon: '🥣', label: 'આયંબિલ (Ayambil)',   avKey: 'ayambilShalaEnabled', visibleWhen: form.ayambilShalaEnabled },
              { k: 'lunch',     icon: '🍽', label: 'બપોરે (Lunch)', visibleWhen: form.isActive },
              { k: 'chovihar',  icon: '🌙', label: 'ચોવિહાર (Chovihar)', visibleWhen: form.isActive },
            ].filter(m => m.visibleWhen).map(({ k, icon, label, avKey: ak }) => {
              const avKey = ak ?? (k + 'Available')
              const stKey = k + 'StartTime'
              const etKey = k + 'EndTime'
              const prKey = k + 'Price'
              return (
                <div key={k} style={{ borderBottom: '1px solid #f0e8d5', paddingBottom: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form[avKey] ? 14 : 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{icon} {label}</span>
                    <GujToggle checked={!!form[avKey]} onChange={v => set(avKey, v)} />
                  </div>
                  {form[avKey] && (
                    <div className="gj-grid-2">
                      <GujField label="Start">
                        <input className="gj-input" type="time" value={form[stKey] || ''} onChange={e => set(stKey, e.target.value)} />
                      </GujField>
                      <GujField label="End">
                        <input className="gj-input" type="time" value={form[etKey] || ''} onChange={e => set(etKey, e.target.value)} />
                      </GujField>
                      <GujField label="Price (₹)" full>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            className="gj-input" type="number" min="0" placeholder="0"
                            value={form[prKey] ?? 0}
                            onChange={e => set(prKey, Number(e.target.value) || 0)}
                            style={{ maxWidth: 110 }}
                          />
                          <span style={{ color: '#78716c', fontSize: 13 }}>0 = Free (નિ:શુલ્ક)</span>
                        </div>
                      </GujField>
                    </div>
                  )}
                </div>
              )
            })}
          </GujSection>

          {/* Tiffin */}
          <GujSection title="🥡 ટિફિન સેવા">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.tiffinAvailable ? 18 : 0 }}>
              <span className="gj-label" style={{ margin: 0 }}>ટિફિન સેવા ઉપલબ્ધ છે?</span>
              <GujToggle checked={form.tiffinAvailable} onChange={v => set('tiffinAvailable', v)} />
            </div>
            {form.tiffinAvailable && (
              <>
                <div className="gj-radio-group" style={{ marginBottom: 16 }}>
                  {[
                    ['OWN',      'તમારું ટિફિન લાવવાનું રહેશે'],
                    ['PROVIDED', 'ટિફિન અમે આપીશું'],
                  ].map(([val, label]) => (
                    <label key={val} className={`gj-radio-item ${form.tiffinType === val ? 'on' : ''}`}>
                      <input type="radio" name="tiffinType" value={val} checked={form.tiffinType === val}
                        onChange={() => set('tiffinType', val)} />
                      <span className="gj-radio-circle"><span className="gj-radio-dot" /></span>
                      <span className="gj-radio-text">{label}</span>
                    </label>
                  ))}
                </div>
                <GujField label="વધારાની માહિતી (વૈકલ્પિક)">
                  <input className="gj-input" value={form.tiffinNotes}
                    placeholder="ઉ.દ. ₹5 વધારાનો ચાર્જ"
                    onChange={e => set('tiffinNotes', e.target.value)} />
                </GujField>
              </>
            )}
          </GujSection>

          {/* Facilities */}
          <GujSection title="🏗 સુવિધાઓ">
            <div className="gj-fac-grid">
              {FACS.map(([key, label]) => (
                <label key={key} className={`gj-fac-item ${form[key] ? 'on' : ''}`}>
                  <input type="checkbox" checked={!!form[key]}
                    onChange={e => set(key, e.target.checked)} />
                  <span className="gj-fac-check">{form[key] ? '✓' : ''}</span>
                  <span className="gj-fac-text">{label}</span>
                </label>
              ))}
            </div>
          </GujSection>

          {/* Photos */}
          <GujSection title="📷 ફોટો ગૅલેરી">
            <div className="gj-photos-grid" style={{ marginBottom: 16 }}>
              <ImageSlot label="મુખ્ય ફોટો" value={form.coverImage}
                onChange={v => set('coverImage', v)} />
              <ImageSlot label="પ્રવેશદ્વાર" value={form.entranceImage}
                onChange={v => set('entranceImage', v)} />
              <ImageSlot label="ડાઇનિંગ હૉલ" value={form.diningHallImage}
                onChange={v => set('diningHallImage', v)} />
            </div>
            <label className="gj-label">વધારાના ફોટા (મહત્તમ 5)</label>
            <GallerySlots photos={form.images} onChange={v => set('images', v)} max={5} />
          </GujSection>

          {/* Notice */}
          <GujSection title="📢 વિશેષ સૂચના" hint="ઉ.દ. આજે બંધ · માત્ર નવકારશી · પર્યુષણ ખાસ સમય">
            <GujField>
              <textarea className="gj-textarea" rows={4} value={form.noticeGujarati}
                placeholder="ઉ.દ. આજે ભોજનશાળા બંધ રહેશે. &#10;ઉ.દ. માત્ર નવકારશી ઉપલબ્ધ."
                onChange={e => set('noticeGujarati', e.target.value)} />
            </GujField>
          </GujSection>
        </>
      )}

      <SaveFooter onSave={handleSave} saving={saving} saved={saved} err={err} />
    </div>
  )
}

// ─── Dharamshala Tab ──────────────────────────────────────────────

function DharamshalaTabs({ bhoj, onSaved }) {
  const [form, setForm] = useState({
    dharamshalaAvailable:    bhoj.dharamshala?.available    ?? bhoj.facilities?.dharamshalaAvailable ?? false,
    dharamshalaDescription:  bhoj.dharamshala?.description  || '',
    dharamshalaLatitude:     bhoj.dharamshala?.latitude     ?? '',
    dharamshalaLongitude:    bhoj.dharamshala?.longitude    ?? '',
    dharamshalaPhotos:       bhoj.dharamshala?.photos       ?? [],
  })
  const [useSameLoc, setUseSameLoc] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [err,    setErr]    = useState('')

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  function handleSameLocToggle(v) {
    setUseSameLoc(v)
    if (v) {
      setForm(p => ({
        ...p,
        dharamshalaLatitude:  bhoj.latitude  ?? '',
        dharamshalaLongitude: bhoj.longitude ?? '',
      }))
    }
  }

  async function handleSave() {
    setSaving(true); setErr(''); setSaved(false)
    try {
      await adminApi.updateMyBhojanshala(form)
      onSaved()
      setSaved(true)
      setTimeout(() => setSaved(false), 5000)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="gj-content">
      <div className="gj-avail-bar">
        <div>
          <div className="gj-avail-title">ધર્મશાળા ઉપલબ્ધ છે?</div>
          <div className="gj-avail-hint">
            {form.dharamshalaAvailable ? '✓ ઉપલબ્ધ' : '✗ ઉપલબ્ધ નથી'}
          </div>
        </div>
        <GujToggle checked={form.dharamshalaAvailable} onChange={v => set('dharamshalaAvailable', v)} />
      </div>

      {form.dharamshalaAvailable && (
        <>
          <GujSection title="📋 ધર્મશાળા વિશે">
            <GujField label="ધર્મશાળા વિશે માહિતી લખો">
              <textarea className="gj-textarea" rows={6} value={form.dharamshalaDescription}
                placeholder={'ઉ.દ. રૂમ ઉપલબ્ધ છે.\nAC રૂમ છે.\nપરિવાર માટે સુવિધા છે.\nDAY BOOKING ₹200 / NIGHT BOOKING ₹350'}
                onChange={e => set('dharamshalaDescription', e.target.value)} />
            </GujField>
          </GujSection>

          <GujSection title="📍 ધર્મશાળાનું સ્થાન">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="gj-label" style={{ margin: 0 }}>ભોજનશાળા જેવું જ સ્થાન</span>
              <GujToggle checked={useSameLoc} onChange={handleSameLocToggle} />
            </div>
            {!useSameLoc && (
              <LocationPicker
                lat={form.dharamshalaLatitude}
                lng={form.dharamshalaLongitude}
                onChange={({ lat, lng }) => setForm(p => ({ ...p, dharamshalaLatitude: lat, dharamshalaLongitude: lng }))}
              />
            )}
            {useSameLoc && bhoj.latitude && (
              <div className="gj-loc-coords">
                📍 {Number(bhoj.latitude).toFixed(5)}, {Number(bhoj.longitude).toFixed(5)} (ભોજનશાળા જ)
              </div>
            )}
          </GujSection>

          <GujSection title="📷 ધર્મશાળા ફોટા (મહત્તમ 5)">
            <GallerySlots
              photos={form.dharamshalaPhotos}
              onChange={v => set('dharamshalaPhotos', v)}
              max={5}
            />
          </GujSection>
        </>
      )}

      <SaveFooter onSave={handleSave} saving={saving} saved={saved} err={err} />
    </div>
  )
}

// ─── Derasar Tab ──────────────────────────────────────────────────

function DerasarTab({ bhoj, onSaved }) {
  const [form, setForm] = useState({
    derasarAvailable:   bhoj.derasar?.available    ?? false,
    derasarDescription: bhoj.derasar?.description  || '',
    derasarLatitude:    bhoj.derasar?.latitude     ?? '',
    derasarLongitude:   bhoj.derasar?.longitude    ?? '',
    derasarPhotos:      bhoj.derasar?.photos       ?? [],
  })
  const [useSameLoc, setUseSameLoc] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [err,    setErr]    = useState('')

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  function handleSameLocToggle(v) {
    setUseSameLoc(v)
    if (v) {
      setForm(p => ({
        ...p,
        derasarLatitude:  bhoj.latitude  ?? '',
        derasarLongitude: bhoj.longitude ?? '',
      }))
    }
  }

  async function handleSave() {
    setSaving(true); setErr(''); setSaved(false)
    try {
      await adminApi.updateMyBhojanshala(form)
      onSaved()
      setSaved(true)
      setTimeout(() => setSaved(false), 5000)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="gj-content">
      <div className="gj-avail-bar">
        <div>
          <div className="gj-avail-title">દેરાસર ઉપલબ્ધ છે?</div>
          <div className="gj-avail-hint">
            {form.derasarAvailable ? '✓ ઉપલબ્ધ' : '✗ ઉપલબ્ધ નથી'}
          </div>
        </div>
        <GujToggle checked={form.derasarAvailable} onChange={v => set('derasarAvailable', v)} />
      </div>

      {form.derasarAvailable && (
        <>
          <GujSection title="📋 દેરાસર વિશે">
            <GujField label="દેરાસર વિશે માહિતી લખો">
              <textarea className="gj-textarea" rows={6} value={form.derasarDescription}
                placeholder={'ઉ.દ. મૂળનાયક ભગવાન – શ્રી આદિનાથ ભગવાન\nઆરતી – 8:00 AM / 12:00 PM / 7:30 PM\nવિશેષ પૂજા – ઉપલબ્ધ'}
                onChange={e => set('derasarDescription', e.target.value)} />
            </GujField>
          </GujSection>

          <GujSection title="📍 દેરાસરનું સ્થાન">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="gj-label" style={{ margin: 0 }}>ભોજનશાળા જેવું જ સ્થાન</span>
              <GujToggle checked={useSameLoc} onChange={handleSameLocToggle} />
            </div>
            {!useSameLoc && (
              <LocationPicker
                lat={form.derasarLatitude}
                lng={form.derasarLongitude}
                onChange={({ lat, lng }) => setForm(p => ({ ...p, derasarLatitude: lat, derasarLongitude: lng }))}
              />
            )}
            {useSameLoc && bhoj.latitude && (
              <div className="gj-loc-coords">
                📍 {Number(bhoj.latitude).toFixed(5)}, {Number(bhoj.longitude).toFixed(5)} (ભોજનશાળા જ)
              </div>
            )}
          </GujSection>

          <GujSection title="📷 દેરાસર ફોટા (મહત્તમ 5)">
            <GallerySlots
              photos={form.derasarPhotos}
              onChange={v => set('derasarPhotos', v)}
              max={5}
            />
          </GujSection>
        </>
      )}

      <SaveFooter onSave={handleSave} saving={saving} saved={saved} err={err} />
    </div>
  )
}

// ─── Main Portal ──────────────────────────────────────────────────

export default function MyDashboard({ goHome }) {
  const { user, signOut }    = useAuth()
  const [bhoj,    setBhoj]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]    = useState('bhojanshala')

  useEffect(() => {
    if (user?.bhojanshalaId) load()
    else setLoading(false)
  }, [user?.bhojanshalaId])

  async function load() {
    setLoading(true)
    try {
      const res = await adminApi.getMyBhojanshala()
      setBhoj(res.data)
    } catch {
      /* handled below */
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    goHome?.()
  }

  const initial = (user?.name?.[0] || 'A').toUpperCase()

  const TABS = [
    { id: 'bhojanshala',  icon: '🍛', label: 'ભોજનશાળા' },
    { id: 'availability', icon: '📅', label: 'ઉપલબ્ધતા' },
    { id: 'dharamshala',  icon: '🛏', label: 'ધર્મશાળા' },
    { id: 'derasar',      icon: '🛕', label: 'દેરાસર' },
  ]

  return (
    <div className="gj-portal">
      {/* Header */}
      <header className="gj-header">
        <div className="gj-header-brand">
          <div className="gj-header-title">જૈન માહિતી પોર્ટલ</div>
          {bhoj && <div className="gj-header-sub">{bhoj.nameGujarati || bhoj.nameEnglish}</div>}
        </div>
        <div className="gj-header-actions">
          {goHome && (
            <button className="gj-header-btn" onClick={goHome} title="Back to website">
              ← Website
            </button>
          )}
          <button className="gj-header-btn danger" onClick={handleSignOut}>
            બહાર
          </button>
        </div>
      </header>

      {loading ? (
        <div className="gj-loading">
          <div className="gj-spinner" />
          <div style={{ color: '#b45309', fontSize: 16 }}>લોડ થઈ રહ્યું છે...</div>
        </div>
      ) : !bhoj ? (
        <div className="gj-empty-state">
          <div className="gj-empty-icon">🏛</div>
          <div className="gj-empty-title">ભોજનશાળા સોંપવામાં આવી નથી</div>
          <div className="gj-empty-text">
            Super Admin ને સંપર્ક કરો.<br />
            તેઓ તમારા account ને ભોજનશાળા સોંપશે.
          </div>
          <button className="gj-empty-btn" onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <nav className="gj-tab-bar">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`gj-tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span className="gj-tab-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          {tab === 'bhojanshala'  && <BhojanshalaTab       bhoj={bhoj} onSaved={load} />}
          {tab === 'availability' && <AvailabilityCalendar bhoj={bhoj} onSaved={load} />}
          {tab === 'dharamshala'  && <DharamshalaTabs      bhoj={bhoj} onSaved={load} />}
          {tab === 'derasar'      && <DerasarTab           bhoj={bhoj} onSaved={load} />}
        </>
      )}
    </div>
  )
}
