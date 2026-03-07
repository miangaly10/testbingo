import {
  Component, OnInit, OnDestroy, signal, computed, inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe, DatePipe, NgStyle } from '@angular/common';
import {
  OpenF1Service,
  OF1Session, OF1Driver, OF1Position, OF1Interval, OF1Lap,
  OF1CarData, OF1Weather, OF1RaceControl, OF1Stint, OF1TeamRadio, OF1Location,
} from '../../core/services/openf1.service';

export interface RadioMessage {
  date:      string;
  driver:    OF1Driver | null;
  url:       string;
  playing:   boolean;
}

export interface MapDot {
  driver: OF1Driver;
  x:      number;
  y:      number;
  pos:    number;
}

// ── Derived types for the view ────────────────────────────────────────────────

export interface LeaderboardRow {
  pos:          number;
  driver:       OF1Driver;
  gap:          string;
  interval:     string;
  lastLap:      string | null;    // mm:ss.mmm
  s1:           string | null;
  s2:           string | null;
  s3:           string | null;
  compound:     string;
  tyreAge:      number;
  pitting:      boolean;
  drs:          boolean;
}

export interface TyreStintSegment {
  compound:  string;
  lapStart:  number;
  lapEnd:    number;
  laps:      number;
  isCurrent: boolean;
}

export interface TyreStrategyRow {
  driver:          OF1Driver;
  pos:             number;
  stints:          TyreStintSegment[];
  currentCompound: string;
  currentAge:      number;
  pitCount:        number;
  currentLap:      number;
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT:         '#E8002D',
  MEDIUM:       '#FFF200',
  HARD:         '#FFFFFF',
  INTERMEDIATE: '#39B54A',
  WET:          '#0067FF',
  UNKNOWN:      '#888',
};
const COMPOUND_ABBR: Record<string, string> = {
  SOFT:'S', MEDIUM:'M', HARD:'H', INTERMEDIATE:'I', WET:'W', UNKNOWN:'?',
};

function fmtLap(secs: number | null): string | null {
  if (secs == null || secs <= 0) return null;
  const m  = Math.floor(secs / 60);
  const s  = Math.floor(secs % 60);
  const ms = Math.round((secs % 1) * 1000);
  return `${m}:${String(s).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
}

function fmtSector(secs: number | null): string | null {
  if (secs == null || secs <= 0) return null;
  return secs.toFixed(3);
}

function fmtGap(raw: string | number | null): string {
  if (raw == null) return '—';
  if (raw === 0 || raw === '0') return 'LEADER';
  return String(raw).startsWith('+') ? String(raw) : `+${raw}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector:    'app-live-tracker',
  standalone:  true,
  imports:     [DecimalPipe, DatePipe, NgStyle],
  templateUrl: './live-tracker.html',
  styleUrl:    './live-tracker.scss',
})
export class LiveTrackerComponent implements OnInit, OnDestroy {
  private router   = inject(Router);
  private api      = inject(OpenF1Service);

  // ── State ──────────────────────────────────────────────────────────────────
  session        = signal<OF1Session | null>(null);
  drivers        = signal<OF1Driver[]>([]);
  positions      = signal<Map<number, number>>(new Map());
  intervals      = signal<Map<number, OF1Interval>>(new Map());
  lastLaps       = signal<Map<number, OF1Lap>>(new Map());
  stints         = signal<Map<number, OF1Stint[]>>(new Map());
  weather        = signal<OF1Weather | null>(null);
  raceControl    = signal<OF1RaceControl[]>([]);

  activeTab      = signal<'leaderboard' | 'strategy' | 'radio' | 'map'>('leaderboard');

  // ── Map state ────────────────────────────────────────────────────────
  readonly MAP_W   = 600;
  readonly MAP_H   = 380;
  readonly MAP_PAD = 28;

  trackRawPts    = signal<{ x: number; y: number }[]>([]);
  driverRawLocs  = signal<Map<number, { x: number; y: number }>>(new Map());
  mapLoading     = signal(false);
  mapLoadedForSk = signal<number | null>(null);

  // Bounds computed from the track outline
  private _mapBounds = computed(() => {
    const pts = this.trackRawPts();
    if (!pts.length) return null;
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scale  = Math.min(
      (this.MAP_W - 2 * this.MAP_PAD) / rangeX,
      (this.MAP_H - 2 * this.MAP_PAD) / rangeY,
    );
    const offX = this.MAP_PAD + ((this.MAP_W - 2 * this.MAP_PAD) - rangeX * scale) / 2;
    const offY = this.MAP_PAD + ((this.MAP_H - 2 * this.MAP_PAD) - rangeY * scale) / 2;
    return { minX, minY, scale, offX, offY };
  });

  // Normalized SVG polyline string for the circuit outline
  trackPolyline = computed<string>(() => {
    const pts = this.trackRawPts();
    const b   = this._mapBounds();
    if (!pts.length || !b) return '';
    return pts
      .map(p => `${((p.x - b.minX) * b.scale + b.offX).toFixed(1)},${(this.MAP_H - ((p.y - b.minY) * b.scale + b.offY)).toFixed(1)}`)
      .join(' ');
  });

  // Normalized driver dots on the SVG
  mapDots = computed<MapDot[]>(() => {
    const b = this._mapBounds();
    if (!b) return [];
    const drvMap = new Map(this.drivers().map(d => [d.driver_number, d]));
    const posMap = this.positions();
    const locs   = this.driverRawLocs();
    const dots: MapDot[] = [];
    locs.forEach((loc, num) => {
      const drv = drvMap.get(num);
      if (!drv) return;
      dots.push({
        driver: drv,
        x: (loc.x - b.minX) * b.scale + b.offX,
        y: this.MAP_H - ((loc.y - b.minY) * b.scale + b.offY),
        pos: posMap.get(num) ?? 99,
      });
    });
    return dots.sort((a, z) => z.pos - a.pos); // render P1 on top
  });

  radioMessages  = signal<RadioMessage[]>([]);
  radioFilter    = signal<number | null>(null); // driver_number or null = all
  currentAudio   = signal<HTMLAudioElement | null>(null);

  radioFiltered  = computed<RadioMessage[]>(() => {
    const all = this.radioMessages();
    const f   = this.radioFilter();
    return f ? all.filter(m => m.driver?.driver_number === f) : all;
  });

  selectedDriver = signal<OF1Driver | null>(null);
  carDataHistory = signal<OF1CarData[]>([]);
  latestCarData  = computed<OF1CarData | null>(() => {
    const arr = this.carDataHistory();
    return arr.length ? arr[arr.length - 1] : null;
  });

  loading    = signal(true);
  error      = signal<string | null>(null);
  lastUpdate = signal<Date | null>(null);

  private _pollId:    ReturnType<typeof setInterval> | null = null;
  private _telemId:   ReturnType<typeof setInterval> | null = null;

  // ── Derived: flag status ───────────────────────────────────────────────────
  trackFlag = computed<{ label: string; cls: string }>(() => {
    const msgs = this.raceControl();
    for (let i = msgs.length - 1; i >= 0; i--) {
      const f = msgs[i].flag;
      if (!f) continue;
      if (f === 'GREEN')              return { label: '🟢 GREEN', cls: 'flag-green' };
      if (f === 'YELLOW')             return { label: '🟡 YELLOW', cls: 'flag-yellow' };
      if (f === 'RED')                return { label: '🔴 RED FLAG', cls: 'flag-red' };
      if (f === 'SAFETY CAR')         return { label: '🚗 SAFETY CAR', cls: 'flag-sc' };
      if (f === 'VIRTUAL SAFETY CAR') return { label: '🟡 VSC', cls: 'flag-vsc' };
      if (f === 'CHEQUERED')          return { label: '🏁 CHEQUERED', cls: 'flag-chq' };
    }
    return { label: '—', cls: '' };
  });

  latestRCMsg = computed<string>(() => {
    const msgs = this.raceControl();
    return msgs.length ? msgs[msgs.length - 1].message : '';
  });

  // ── Derived: leaderboard ───────────────────────────────────────────────────
  leaderboard = computed<LeaderboardRow[]>(() => {
    const driversArr = this.drivers();
    const posMap     = this.positions();
    const intMap     = this.intervals();
    const lapMap     = this.lastLaps();
    const stintMap   = this.stints();

    return driversArr
      .map(d => {
        const pos    = posMap.get(d.driver_number) ?? 99;
        const iv     = intMap.get(d.driver_number);
        const lap    = lapMap.get(d.driver_number);
        const stints = stintMap.get(d.driver_number) ?? [];
        const stint  = stints[stints.length - 1];

        return {
          pos,
          driver:   d,
          gap:      fmtGap(iv?.gap_to_leader ?? null),
          interval: fmtGap(iv?.interval     ?? null),
          lastLap:  fmtLap(lap?.lap_duration ?? null),
          s1:       fmtSector(lap?.duration_sector1 ?? null),
          s2:       fmtSector(lap?.duration_sector2 ?? null),
          s3:       fmtSector(lap?.duration_sector3 ?? null),
          compound: stint?.compound ?? 'UNKNOWN',
          tyreAge:  stint?.tyre_age_at_start ?? 0,
          pitting:  false,
          drs:      false,
        } satisfies LeaderboardRow;
      })
      .sort((a, b) => a.pos - b.pos);
  });

  // ── Derived: tyre strategy ─────────────────────────────────────────────────
  tyreStrategy = computed<TyreStrategyRow[]>(() => {
    const driversArr = this.drivers();
    const posMap     = this.positions();
    const stintMap   = this.stints();
    const lapMap     = this.lastLaps();

    // Estimate total race laps from max known lap + buffer
    let maxLap = 0;
    lapMap.forEach(l => { if (l.lap_number > maxLap) maxLap = l.lap_number; });
    this._maxRaceLap = maxLap || 1;

    return driversArr
      .map(d => {
        const pos    = posMap.get(d.driver_number) ?? 99;
        const allSt  = (stintMap.get(d.driver_number) ?? []).slice().sort((a, b) => a.stint_number - b.stint_number);
        const curLap = lapMap.get(d.driver_number)?.lap_number ?? 0;

        const segments: TyreStintSegment[] = allSt.map((s, idx) => {
          const isLast = idx === allSt.length - 1;
          const lapEnd = s.lap_end ?? (isLast ? curLap : (allSt[idx + 1]?.lap_start ?? curLap));
          return {
            compound:  s.compound,
            lapStart:  s.lap_start,
            lapEnd,
            laps:      Math.max(1, lapEnd - s.lap_start + 1),
            isCurrent: isLast,
          };
        });

        const lastSt = allSt[allSt.length - 1];
        return {
          driver:          d,
          pos,
          stints:          segments,
          currentCompound: lastSt?.compound ?? 'UNKNOWN',
          currentAge:      curLap - (lastSt?.lap_start ?? 0) + (lastSt?.tyre_age_at_start ?? 0),
          pitCount:        Math.max(0, allSt.length - 1),
          currentLap:      curLap,
        } satisfies TyreStrategyRow;
      })
      .sort((a, b) => a.pos - b.pos);
  });

  _maxRaceLap = 1;

  stintWidthPct(laps: number): number {
    return Math.max(2, (laps / Math.max(this._maxRaceLap, 1)) * 100);
  }

  // ── view helpers ──────────────────────────────────────────────────────────
  compoundColor(c: string): string { return COMPOUND_COLORS[c] ?? '#888'; }
  compoundAbbr(c: string):  string { return COMPOUND_ABBR[c]   ?? '?'; }

  drsActive(cd: OF1CarData | null): boolean { return (cd?.drs ?? 0) >= 10; }

  readonly sortByPos = (a: MapDot, b: MapDot) => a.pos - b.pos;

  speedPoints = computed<string>(() => {
    const arr = this.carDataHistory();
    if (arr.length < 2) return '';
    const W = 400, H = 80;
    const maxS = 370, step = W / (arr.length - 1);
    return arr.map((d, i) => `${(i * step).toFixed(1)},${(H - (d.speed / maxS) * H).toFixed(1)}`).join(' ');
  });

  rpmPercent = computed<number>(() => {
    const cd = this.latestCarData();
    return cd ? Math.min(100, (cd.rpm / 15000) * 100) : 0;
  });

  sessionStatus = computed<string>(() => {
    const s = this.session();
    if (!s) return 'Chargement…';
    if (s.status === 'ontrack')  return '🔴 LIVE';
    if (s.status === 'complete') return '✅ Terminé';
    return '⏳ À venir';
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    await this.loadAll();
    this.loading.set(false);
    // Poll every 1 s — requests are staggered so at most 1–2 req/tick
    this._pollId = setInterval(() => this.pollLive(), 1_000);
  }

  ngOnDestroy(): void {
    if (this._pollId)  clearInterval(this._pollId);
    if (this._telemId) clearInterval(this._telemId);
  }

  // ── Initial full load ──────────────────────────────────────────────────────
  private async loadAll(): Promise<void> {
    try {
      // Fetch all 2026 Race sessions
      const sessions = await this.api.getRaceSessions(2026);
      const sess = this.pickBestSession(sessions);
      this.session.set(sess);

      if (!sess) return;
      const sk = sess.session_key;

      // Drivers
      const drivers = await this.api.getDrivers(sk);
      this.drivers.set(drivers);

    await Promise.all([
        this.fetchPositions(sk),
        this.fetchIntervals(sk),
        this.fetchLaps(sk),
        this.fetchStints(sk),
        this.fetchWeather(sk),
        this.fetchRaceControl(sk),
        this.fetchTeamRadio(sk),
      ]);
      // Track outline loaded separately (can be heavy)
      this.fetchTrackOutline(sk);
      this.lastUpdate.set(new Date());
    } catch {
      this.error.set('Impossible de charger les données OpenF1.');
    }
  }

  // ── Periodic poll ─────────────────────────────────────────────────────────
  //
  // Tick = 1 s. At most 1–2 requests per tick to stay sous les rate limits :
  //   Every tick   (  1 s): positions
  //   Every 3rd    (  3 s): intervals
  //   Every 5th    (  5 s): race_control
  //   Every 10th   ( 10 s): laps + (car_data si conducteur sélectionné)
  //   Every 15th   ( 15 s): map locations (si onglet map actif)
  //   Every 30th   ( 30 s): weather + team_radio
  //   Every 60th   ( 60 s): stints
  //
  private async pollLive(): Promise<void> {
    // Skip if a previous poll is still in flight
    if (this._isPolling) return;
    this._isPolling = true;

    try {
      // If the initial load failed (API timeout, empty response…), retry it
      // with back-off: attempts 1–4 → every tick, then 1 out of N ticks
      if (!this.session()) {
        this._sessionRetries++;
        const backoffEvery = Math.min(this._sessionRetries, 12); // cap at 60 s
        if (this._sessionRetries % backoffEvery === 0) {
          await this.loadAll();
          this.loading.set(false);
        }
        return;
      }
      this._sessionRetries = 0;

      const sess = this.session()!;
      const sk   = sess.session_key;
      const tick = ++this._stintPollCounter;

      // ── Every tick (1 s): positions — donnée la plus volatile
      await this.fetchPositions(sk);
      this.lastUpdate.set(new Date());

      // ── Every 3rd tick (3 s): intervals
      if (tick % 3 === 0) {
        await this.fetchIntervals(sk);
      }

      // ── Every 5th tick (5 s): race control
      if (tick % 5 === 0) {
        await this.fetchRaceControl(sk);
      }

      // ── Every 10th tick (10 s): laps + télémétrie
      if (tick % 10 === 0) {
        await this.fetchLaps(sk);
        const d = this.selectedDriver();
        if (d) await this.fetchCarData(sk, d.driver_number);
      }

      // ── Every 15th tick (15 s): map locations si onglet actif
      if (tick % 15 === 0 && this.activeTab() === 'map') {
        await this.fetchLiveLocations(sk);
      }

      // ── Every 30th tick (30 s): weather + radio
      if (tick % 30 === 0) {
        await Promise.all([this.fetchWeather(sk), this.fetchTeamRadio(sk)]);
      }

      // ── Every 60th tick (60 s): stints (pit strategy rarely changes)
      if (tick % 60 === 0) {
        await this.fetchStints(sk);
      }
    } finally {
      this._isPolling = false;
    }
  }

  private _stintPollCounter  = 0;
  private _isPolling         = false;
  private _sessionRetries    = 0;

  // ── Data fetchers ──────────────────────────────────────────────────────────
  private async fetchPositions(sk: number): Promise<void> {
    const arr = await this.api.getPositions(sk);
    // Keep only latest position per driver
    const map = new Map<number, number>();
    arr.forEach(p => map.set(p.driver_number, p.position));
    this.positions.set(map);
  }

  private async fetchIntervals(sk: number): Promise<void> {
    const arr = await this.api.getIntervals(sk);
    const map = new Map<number, OF1Interval>();
    arr.forEach(iv => map.set(iv.driver_number, iv));
    this.intervals.set(map);
  }

  private async fetchLaps(sk: number): Promise<void> {
    const arr = await this.api.getLaps(sk);
    const map = new Map<number, OF1Lap>();
    arr.forEach(l => {
      const cur = map.get(l.driver_number);
      if (!cur || l.lap_number > cur.lap_number) map.set(l.driver_number, l);
    });
    this.lastLaps.set(map);
  }

  private async fetchStints(sk: number): Promise<void> {
    const arr = await this.api.getStints(sk);
    const map = new Map<number, OF1Stint[]>();
    arr.forEach(s => {
      const list = map.get(s.driver_number) ?? [];
      list.push(s);
      map.set(s.driver_number, list);
    });
    // Sort each driver's stints by stint_number
    map.forEach((list, key) => map.set(key, list.sort((a, b) => a.stint_number - b.stint_number)));
    this.stints.set(map);
  }

  private async fetchWeather(sk: number): Promise<void> {
    const arr = await this.api.getWeather(sk);
    this.weather.set(arr[arr.length - 1] ?? null);
  }

  private async fetchRaceControl(sk: number): Promise<void> {
    const arr = await this.api.getRaceControl(sk);
    this.raceControl.set(arr);
  }

  private async fetchCarData(sk: number, driverNumber: number): Promise<void> {
    const arr = await this.api.getCarData(sk, driverNumber);
    // Keep last 200 data points for the chart
    this.carDataHistory.set(arr.slice(-200));
  }

  private async fetchTeamRadio(sk: number): Promise<void> {
    const arr  = await this.api.getTeamRadio(sk);
    const drvs = this.drivers();
    const drvMap = new Map(drvs.map(d => [d.driver_number, d]));
    // Newest first, keep max 200
    const msgs: RadioMessage[] = arr
      .slice(-200)
      .reverse()
      .map(r => ({
        date:    r.date,
        driver:  drvMap.get(r.driver_number) ?? null,
        url:     r.recording_url,
        playing: false,
      }));
    this.radioMessages.set(msgs);
  }

  /** Fetch one driver's full-session trace to build the circuit outline. */
  private async fetchTrackOutline(sk: number): Promise<void> {
    if (this.mapLoadedForSk() === sk) return; // already loaded
    this.mapLoading.set(true);
    const drivers = this.drivers();
    if (!drivers.length) { this.mapLoading.set(false); return; }
    // Use the race leader (or first driver in list) as reference
    const posMap   = this.positions();
    const refNum   = [...posMap.entries()].sort((a, b) => a[1] - b[1])[0]?.[0]
                     ?? drivers[0].driver_number;
    const arr = await this.api.getLocation(sk, refNum);
    if (!arr.length) { this.mapLoading.set(false); return; }
    // Thin to max 1200 evenly-spaced points to keep SVG lean
    const step    = Math.max(1, Math.floor(arr.length / 1200));
    const thinned = arr
      .filter((_, i) => i % step === 0)
      .map(l => ({ x: l.x, y: l.y }));
    this.trackRawPts.set(thinned);
    // Seed driver dots with their current location
    await this.fetchLiveLocations(sk);
    this.mapLoadedForSk.set(sk);
    this.mapLoading.set(false);
  }

  /** Fetch latest location for all drivers (for live dots). */
  private async fetchLiveLocations(sk: number): Promise<void> {
    const arr = await this.api.getLocation(sk);
    if (!arr.length) return;
    const map = new Map<number, { x: number; y: number }>();
    // arr is sorted by date asc — iterate forward so last value wins (most recent)
    arr.forEach((l: OF1Location) => map.set(l.driver_number, { x: l.x, y: l.y }));
    this.driverRawLocs.set(map);
  }

  // ── Radio playback ─────────────────────────────────────────────────────────
  playRadio(msg: RadioMessage): void {
    // Stop current
    const cur = this.currentAudio();
    if (cur) { cur.pause(); cur.currentTime = 0; }

    if (msg.playing) {
      // Toggle off
      msg.playing = false;
      this.currentAudio.set(null);
      this.radioMessages.set([...this.radioMessages()]);
      return;
    }

    // Mark all as not playing
    this.radioMessages().forEach(m => m.playing = false);
    msg.playing = true;
    this.radioMessages.set([...this.radioMessages()]);

    const audio = new Audio(msg.url);
    audio.play().catch(() => {});
    audio.onended = () => {
      msg.playing = false;
      this.currentAudio.set(null);
      this.radioMessages.set([...this.radioMessages()]);
    };
    this.currentAudio.set(audio);
  }

  radioFmtTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // ── Driver selection ───────────────────────────────────────────────────────
  async selectDriver(driver: OF1Driver): Promise<void> {
    if (this.selectedDriver()?.driver_number === driver.driver_number) {
      this.selectedDriver.set(null);
      this.carDataHistory.set([]);
      if (this._telemId) { clearInterval(this._telemId); this._telemId = null; }
      return;
    }
    this.selectedDriver.set(driver);
    const sk = this.session()?.session_key;
    if (!sk) return;
    await this.fetchCarData(sk, driver.driver_number);
  }

  /**
   * Pick the best session to display:
   * 1. A session currently ontrack
   * 2. The most recent session whose date_start is in the past (started)
   * 3. The next upcoming session (race hasn't started yet)
   */
  private pickBestSession(sessions: OF1Session[]): OF1Session | null {
    if (!sessions.length) return null;
    const now = Date.now();

    // 1. Prefer a live race
    const live = sessions.find(s => s.status === 'ontrack');
    if (live) return live;

    // 2. Most recent past race (date_start <= now)
    const past = sessions
      .filter(s => new Date(s.date_start).getTime() <= now)
      .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
    if (past.length) return past[0];

    // 3. Next upcoming race
    const upcoming = sessions
      .filter(s => new Date(s.date_start).getTime() > now)
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
    return upcoming[0] ?? null;
  }

  goBack(): void { this.router.navigate(['/']); }
}
