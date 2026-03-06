import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';

const BASE = 'https://api.openf1.org/v1';

// ── API types ────────────────────────────────────────────────────────────────

export interface OF1Session {
  session_key:        number;
  session_name:       string;
  session_type:       string;
  status:             'upcoming' | 'ontrack' | 'complete';
  date_start:         string;
  date_end:           string;
  circuit_key:        number;
  circuit_short_name: string;
  country_name:       string;
  country_code:       string;
  year:               number;
  location:           string;
  gmt_offset:         string;
  meeting_key:        number;
}

export interface OF1Driver {
  session_key:    number;
  driver_number:  number;
  broadcast_name: string;
  country_code:   string;
  first_name:     string;
  full_name:      string;
  headshot_url:   string;
  last_name:      string;
  meeting_key:    number;
  name_acronym:   string;
  team_colour:    string;   // hex without #
  team_name:      string;
}

export interface OF1Position {
  session_key:   number;
  driver_number: number;
  date:          string;
  position:      number;
}

export interface OF1Interval {
  session_key:   number;
  driver_number: number;
  date:          string;
  gap_to_leader: string | number | null;
  interval:      string | number | null;
}

export interface OF1Lap {
  session_key:      number;
  driver_number:    number;
  lap_number:       number;
  lap_duration:     number | null;
  duration_sector1: number | null;
  duration_sector2: number | null;
  duration_sector3: number | null;
  is_pit_out_lap:   boolean;
  is_valid_for_best: boolean;
  i1_speed:         number | null;
  i2_speed:         number | null;
  st_speed:         number | null;
  date_start:       string;
}

export interface OF1CarData {
  session_key:   number;
  driver_number: number;
  date:          string;
  brake:         number;   // 0-100
  drs:           number;   // 0=no drs, 8=eligible, 10=active, 12=active
  n_gear:        number;   // 0-8
  rpm:           number;
  speed:         number;   // km/h
  throttle:      number;   // 0-100
}

export interface OF1Weather {
  session_key:       number;
  date:              string;
  air_temperature:   number;
  humidity:          number;
  pressure:          number;
  rainfall:          number;
  track_temperature: number;
  wind_direction:    number;
  wind_speed:        number;
}

export interface OF1RaceControl {
  session_key:   number;
  meeting_key:   number;
  date:          string;
  category:      string;
  driver_number: number | null;
  flag:          string | null;
  lap_number:    number | null;
  message:       string;
  scope:         string | null;
  sector:        number | null;
}

export interface OF1Stint {
  session_key:         number;
  driver_number:       number;
  meeting_key:         number;
  stint_number:        number;
  lap_start:           number;
  lap_end:             number | null;
  compound:            'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';
  tyre_age_at_start:   number;
}

export interface OF1TeamRadio {
  session_key:    number;
  meeting_key:    number;
  driver_number:  number;
  date:           string;   // ISO timestamp
  recording_url:  string;   // MP3 URL
}

export interface OF1Location {
  session_key:   number;
  driver_number: number;
  date:          string;
  x:             number;
  y:             number;
  z:             number;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class OpenF1Service {
  private http = inject(HttpClient);

  // Generic safe fetch – returns empty array on error
  private get<T>(endpoint: string, params: Record<string, string | number> = {}): Observable<T[]> {
    let httpParams = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      httpParams = httpParams.set(k, String(v));
    }
    return this.http.get<T[]>(`${BASE}/${endpoint}`, { params: httpParams })
      .pipe(catchError(() => of([])));
  }

  /** Race sessions for a given year. Defaults to current year. */
  getRaceSessions(year: number = new Date().getFullYear()): Observable<OF1Session[]> {
    return this.get<OF1Session>('sessions', { session_type: 'Race', year });
  }

  getDrivers(sessionKey: number | 'latest' = 'latest'): Observable<OF1Driver[]> {
    return this.get<OF1Driver>('drivers', { session_key: sessionKey });
  }

  /** Latest position for every driver */
  getPositions(sessionKey: number | 'latest' = 'latest'): Observable<OF1Position[]> {
    return this.get<OF1Position>('position', { session_key: sessionKey });
  }

  /** Latest intervals for every driver */
  getIntervals(sessionKey: number | 'latest' = 'latest'): Observable<OF1Interval[]> {
    return this.get<OF1Interval>('intervals', { session_key: sessionKey });
  }

  /** All laps (large payload – filter by driver if possible) */
  getLaps(sessionKey: number | 'latest' = 'latest', driverNumber?: number): Observable<OF1Lap[]> {
    const p: Record<string, string | number> = { session_key: sessionKey };
    if (driverNumber) p['driver_number'] = driverNumber;
    return this.get<OF1Lap>('laps', p);
  }

  /** Latest car telemetry — returns last ~100 rows per driver */
  getCarData(sessionKey: number | 'latest' = 'latest', driverNumber?: number): Observable<OF1CarData[]> {
    const p: Record<string, string | number> = { session_key: sessionKey, speed: 0 };
    if (driverNumber) p['driver_number'] = driverNumber;
    return this.get<OF1CarData>('car_data', p);
  }

  getWeather(sessionKey: number | 'latest' = 'latest'): Observable<OF1Weather[]> {
    return this.get<OF1Weather>('weather', { session_key: sessionKey });
  }

  getRaceControl(sessionKey: number | 'latest' = 'latest'): Observable<OF1RaceControl[]> {
    return this.get<OF1RaceControl>('race_control', { session_key: sessionKey });
  }

  getStints(sessionKey: number | 'latest' = 'latest'): Observable<OF1Stint[]> {
    return this.get<OF1Stint>('stints', { session_key: sessionKey });
  }

  getTeamRadio(sessionKey: number | 'latest' = 'latest'): Observable<OF1TeamRadio[]> {
    return this.get<OF1TeamRadio>('team_radio', { session_key: sessionKey });
  }

  /**
   * Location data (x/y/z GPS on track).
   * driverNumber — restrict to one driver (for circuit outline).
   */
  getLocation(sessionKey: number | 'latest', driverNumber?: number): Observable<OF1Location[]> {
    const p: Record<string, string | number> = { session_key: sessionKey };
    if (driverNumber) p['driver_number'] = driverNumber;
    return this.get<OF1Location>('location', p);
  }
}
