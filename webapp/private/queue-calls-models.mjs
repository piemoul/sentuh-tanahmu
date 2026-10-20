// Native api/notifikasi model: six required Strings, with id/tipe discarded.
// Date grammar/normalization corroborated by the target Dart SDK 3.12.2.
// See analysis/QUEUE-CALLS-MODEL-CONTRACT.md for local-time and range limits.
const DATE_PATTERN = /^([+-]?\d{4,6})-?(\d\d)-?(\d\d)(?:[ T](\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d+))?)?)?( ?[zZ]| ?([-+])(\d\d)(?::?(\d\d))?)?)?$/;
const MAX_MICROSECONDS = 8640000000000000000n;
const DAY_MICROSECONDS = 86400000000n;
const MONTH_DAYS = [0,31,59,90,120,151,181,212,243,273,304,334];

function invalid() {
  throw Object.assign(new Error('Respons panggilan antrean belum sesuai format layanan.'), {
    status:502, code:'QUEUE_CALLS_RESPONSE_UNRECOGNIZED',
  });
}

function record(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) invalid();
  return value;
}

function field(value, key) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !Object.hasOwn(descriptor, 'value')) invalid();
  return descriptor.value;
}

function requiredString(value, key) {
  const result = field(value, key);
  if (typeof result !== 'string') invalid();
  return result;
}

function floorDivide(value, divisor) {
  const quotient = value / divisor;
  return value < 0n && value % divisor !== 0n ? quotient - 1n : quotient;
}

function dateValue(raw) {
  const match = DATE_PATTERN.exec(raw);
  if (!match) invalid();
  const values = match.slice(1,7).map(value => Number(value ?? 0));
  let [year,month,day,hour,minute,second] = values;
  const microsecond = Number((match[7] ?? '').slice(0,6).padEnd(6,'0'));
  // Normalize month before computing the proleptic Gregorian day. All parsed
  // calendar components are bounded digit groups, safely exact JS integers.
  const monthIndex = month - 1;
  year += Math.floor(monthIndex / 12);
  month = ((monthIndex % 12) + 12) % 12;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = 365 * (year - 1970) + Math.floor((year - 1969) / 4)
    - Math.floor((year - 1901) / 100) + Math.floor((year - 1601) / 400)
    + MONTH_DAYS[month] + (leap && month >= 2 ? 1 : 0) + day - 1;
  if (match[9]) {
    const offset = Number(match[10]) * 60 + Number(match[11] ?? 0);
    minute -= match[9] === '-' ? -offset : offset;
  }
  const micros = BigInt(days) * DAY_MICROSECONDS + BigInt(hour) * 3600000000n
    + BigInt(minute) * 60000000n + BigInt(second) * 1000000n + BigInt(microsecond);
  // No signed64 overflow/wrap emulation. For naive dates this also bounds the
  // civil clock before a browser applies its zone; edge-zone rescue is omitted.
  if (micros < -MAX_MICROSECONDS || micros > MAX_MICROSECONDS) invalid();
  if (match[8]) return {timeKind:'instant', epochMicroseconds:micros.toString()};

  // UTC getters are only a zone-neutral calendar normalizer here, not a claim
  // that the unzoned input is UTC. Keep microseconds outside Date's precision.
  const normalized = new Date(Number(floorDivide(micros,1000n)));
  return {
    timeKind:'local', epochMicroseconds:null,
    localDateTime:{
      year:normalized.getUTCFullYear(), month:normalized.getUTCMonth()+1,
      day:normalized.getUTCDate(), hour:normalized.getUTCHours(),
      minute:normalized.getUTCMinutes(), second:normalized.getUTCSeconds(),
      microsecond,
    },
  };
}

function parseItem(value) {
  record(value);
  requiredString(value,'id');
  requiredString(value,'tipe');
  const pesan = requiredString(value,'pesan');
  const pengirim = requiredString(value,'pengirim');
  const penerima = requiredString(value,'penerima');
  const tanggal_dikirim = requiredString(value,'tanggal_dikirim');
  return {pesan,pengirim,penerima,tanggal_dikirim,...dateValue(tanggal_dikirim)};
}

export function parseQueueCallsEnvelope(body) {
  record(body);
  const rows = field(body,'data');
  if (!Array.isArray(rows)) invalid();
  // error/message are deliberately neither consulted nor returned. Keep order
  // and duplicates; descending DateTime comparison belongs to the caller UI.
  return {data:Array.from({length:rows.length},(_,index) => parseItem(field(rows,String(index))))};
}

export function parseQueueCallsJson(raw) {
  if (typeof raw !== 'string') invalid();
  let body;
  try { body = JSON.parse(raw); }
  catch { invalid(); }
  return parseQueueCallsEnvelope(body);
}
