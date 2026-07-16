declare module "react-simple-maps" {
  import * as React from "react";

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }
  export const ComposableMap: React.FC<ComposableMapProps>;

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    onMoveEnd?: (pos: { coordinates: [number, number]; zoom: number }) => void;
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;

  export interface GeographiesProps {
    geography: string | object;
    onLoad?: () => void;
    children: (args: { geographies: Geography[] }) => React.ReactNode;
  }
  export const Geographies: React.FC<GeographiesProps>;

  export interface Geography {
    rsmKey: string;
    [key: string]: unknown;
  }
  export interface GeographyProps {
    geography: Geography;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    [key: string]: unknown;
  }
  export const Geography: React.FC<GeographyProps>;

  export interface MarkerProps {
    coordinates: [number, number];
    onClick?: () => void;
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export const Marker: React.FC<MarkerProps>;

  export interface LineProps {
    from?: [number, number];
    to?: [number, number];
    stroke?: string;
    strokeWidth?: number;
    [key: string]: unknown;
  }
  export const Line: React.FC<LineProps>;
}
