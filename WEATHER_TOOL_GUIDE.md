# Weather Tool Integration Guide

This document explains how the weather tool has been integrated into the Agent One chat application using AI SDK 5.

## Overview

The weather tool allows the AI to fetch real-time weather data for any location using latitude and longitude coordinates. The tool uses the Open-Meteo API to retrieve current weather conditions including temperature, weather description, wind speed, and more.

## How It Works

### 1. Tool Definition
The weather tool is defined in `src/lib/ai/tools/weather.ts` with:
- **Name**: "weather"
- **Description**: Get the weather for a given location using latitude and longitude
- **Input Schema**: Requires latitude and longitude (numbers)
- **Execute Function**: Fetches data from Open-Meteo API

### 2. Integration Points

#### Backend Integration
- **Transport Layer**: The weather tool is registered in `CustomChatTransport` (`src/lib/ai/custom-chat-transport.ts`)
- **Multi-step Support**: Enabled with `maxSteps: 5` in the `useChat` hook
- **Server-side Execution**: The tool runs on the server and returns formatted weather data

#### Frontend Integration
- **Message Parts**: Weather tool calls are rendered using `MessagePartToolWeather` component
- **UI States**: Handles all tool states (input-streaming, input-available, output-available, output-error)
- **Visual Design**: Weather-specific icons and styled cards for better UX

### 3. User Experience Flow

1. **User asks for weather**: "What's the weather like in New York?" (with coordinates)
2. **AI calls tool**: The model generates a weather tool call with lat/lng
3. **Loading state**: Shows "Getting weather for coordinates..." with loading indicator
4. **Weather display**: Shows formatted weather card with:
   - Weather icon (based on conditions)
   - Temperature
   - Weather description
   - Wind speed and direction
   - Day/night indicator
   - Timestamp

### 4. UI Components

#### Weather Tool Component (`src/components/a1/messages/parts/tool-weather.tsx`)
- **Icons**: Weather-specific icons using Lucide React
- **States**: Handles all tool execution states
- **Styling**: Beautiful gradient cards with proper dark mode support
- **Data Parsing**: Extracts structured data from weather API response

#### Generic Tool Component (`src/components/a1/messages/parts/tool-call.tsx`)
- **Fallback**: Handles any other tool calls not specifically implemented
- **Debug Info**: Shows tool parameters and outputs for development

### 5. Technical Implementation

#### Tool Registration
```typescript
// In CustomChatTransport
tools: {
  weather: WeatherTool,
}
```

#### Message Part Routing
```typescript
// In MessageParts component
case "tool-weather":
  return (
    <MessagePartToolWeather
      key={`${message.id}-${i}`}
      part={part}
    />
  );
```

#### Weather Data Structure
The tool returns a formatted string containing:
- Weather description (e.g., "Clear sky", "Rain")
- Day/night indicator
- Temperature in Celsius
- Wind speed and cardinal direction
- Timestamp

### 6. Error Handling

- **Network errors**: Gracefully handled with error messages
- **Invalid coordinates**: Returns appropriate error messages
- **API failures**: Shows user-friendly error states in UI

### 7. Example Usage

**User Input:**
```
"What's the weather like at coordinates 40.7128, -74.0060?"
```

**AI Response:**
The AI will automatically call the weather tool and display a formatted weather card showing current conditions for New York City.

## Development Notes

### Adding New Tools
To add more tools, follow this pattern:
1. Create tool definition in `src/lib/ai/tools/`
2. Add to `CustomChatTransport` tools object
3. Create UI component in `src/components/a1/messages/parts/`
4. Add routing in `MessageParts` component

### Tool States
All tools support these states:
- `input-streaming`: Tool parameters being generated
- `input-available`: Tool ready to execute
- `output-available`: Tool completed successfully
- `output-error`: Tool execution failed

### Styling Guidelines
- Use consistent color schemes (blue for weather, green for success, red for errors)
- Include loading states and animations
- Support dark mode
- Use appropriate icons from Lucide React

## Dependencies

- **AI SDK 5**: Core framework for tool calling
- **Open-Meteo API**: Free weather data (no API key required)
- **Lucide React**: Icons for UI components
- **Tailwind CSS**: Styling and responsive design

## Future Enhancements

- **Location Resolution**: Add geocoding to convert city names to coordinates
- **Weather Forecast**: Extend to show multi-day forecasts
- **Weather Alerts**: Include severe weather warnings
- **Unit Conversion**: Support both Celsius and Fahrenheit
- **Visual Weather**: Add weather maps or charts