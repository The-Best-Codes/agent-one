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
        const { temperature, windspeed, winddirection, is_day, time } =
          data.current_weather;

        const dayNight = is_day === 1 ? "Day" : "Night";

        return {
          temperature,
          windSpeed: windspeed,
          windDirection: winddirection,
          dayNight,
          time,
          schema: {
            temperature: "The temperature in Celsius",
            windSpeed: "The wind speed in km/h",
            windDirection: "The wind direction in degrees",
            dayNight: "Current day or night value",
            time: "The time of the weather data",
          },
        };
      } else {
        return "Could not retrieve current weather data for the given coordinates.";
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return `Failed to get weather data: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
