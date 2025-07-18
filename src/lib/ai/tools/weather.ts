import { tool } from "ai";
import { z } from "zod";

export const WeatherTool = tool({
  name: "weather",
  description:
    "Get the weather for a given location using latitude and longitude",
  inputSchema: z.object({
    latitude: z.number().describe("The latitude of the location"),
    longitude: z.number().describe("The longitude of the location"),
  }),
  execute: async ({ latitude, longitude }) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.current_weather) {
        const {
          temperature,
          weathercode,
          windspeed,
          winddirection,
          is_day,
          time,
        } = data.current_weather;

        // Open-Meteo weather codes mapping (simplified for example)
        // For a full list, refer to Open-Meteo documentation: https://www.open-meteo.com/en/docs/current-weather-api
        let weatherDescription = "Unknown";
        switch (weathercode) {
          case 0:
            weatherDescription = "Clear sky";
            break;
          case 1:
          case 2:
          case 3:
            weatherDescription = "Mainly clear, partly cloudy, and overcast";
            break;
          case 45:
          case 48:
            weatherDescription = "Fog and depositing rime fog";
            break;
          case 51:
          case 53:
          case 55:
            weatherDescription = "Drizzle";
            break;
          case 56:
          case 57:
            weatherDescription = "Freezing Drizzle";
            break;
          case 61:
          case 63:
          case 65:
            weatherDescription = "Rain";
            break;
          case 66:
          case 67:
            weatherDescription = "Freezing Rain";
            break;
          case 71:
          case 73:
          case 75:
            weatherDescription = "Snow fall";
            break;
          case 77:
            weatherDescription = "Snow grains";
            break;
          case 80:
          case 81:
          case 82:
            weatherDescription = "Rain showers";
            break;
          case 85:
          case 86:
            weatherDescription = "Snow showers";
            break;
          case 95:
            weatherDescription = "Thunderstorm";
            break;
          case 96:
          case 99:
            weatherDescription = "Thunderstorm with slight and heavy hail";
            break;
          default:
            weatherDescription = "Unknown weather code";
            break;
        }

        const dayNight = is_day === 1 ? "Day" : "Night";

        const getCardinalDirection = (deg: number) => {
          if (deg > 337.5 || deg <= 22.5) return "N";
          if (deg > 22.5 && deg <= 67.5) return "NE";
          if (deg > 67.5 && deg <= 112.5) return "E";
          if (deg > 112.5 && deg <= 157.5) return "SE";
          if (deg > 157.5 && deg <= 202.5) return "S";
          if (deg > 202.5 && deg <= 247.5) return "SW";
          if (deg > 247.5 && deg <= 292.5) return "W";
          if (deg > 292.5 && deg <= 337.5) return "NW";
          return "";
        };
        const windDirectionCardinal = getCardinalDirection(winddirection);

        return `${weatherDescription} (${dayNight}) with a temperature of ${temperature}°C. Wind: ${windspeed} km/h ${windDirectionCardinal}. (As of ${time})`;
      } else {
        return "Could not retrieve current weather data for the given coordinates.";
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return `Failed to get weather data: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
