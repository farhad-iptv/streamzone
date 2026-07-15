export interface EventChannel {
  title: string;
  link: string;
  logo?: string;
  type?: number;
  api?: string;
  tokenApi?: string;
}

export interface EventInfo {
  teamA: string;
  teamB: string;
  teamAFlag: string;
  teamBFlag: string;
  eventName: string;
  isHot: string;
  Status: string;
  startTime: string;
  endTime: string;
  score?: string;
}

export interface SportsEvent {
  id: number;
  title: string;
  image: string;
  cat: string;
  eventInfo: EventInfo;
  channels_data: EventChannel[];
  calculatedStatus?: string;
}

export interface ApiResponse {
  " NAME ": string;
  AUTHOR: string;
  events: SportsEvent[];
}
