export interface WeatherApiCondition {
  text: string;
}

export interface WeatherApiCurrent {
  temp_c: number;
  humidity: number;
  condition: WeatherApiCondition;
}

export interface WeatherApiResponse {
  current: WeatherApiCurrent;
}
