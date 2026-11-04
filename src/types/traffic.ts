export type SignalColor = 'RED' | 'YELLOW' | 'GREEN';

export interface TrafficSignal {
  id: string;
  name: string;
  junction: string;
  currentStatus: SignalColor;
  timeRemaining: number; // in seconds
  redDuration: number;
  yellowDuration: number;
  greenDuration: number;
  coordinates: [number, number]; // [lat, lng]
  distanceFromUserMeters: number;
  recommendedSpeedKmph: number;
  emergencyOverridden: boolean;
  assignedCorridorId?: string;
}

export interface RoadblockPrediction {
  id: string;
  roadName: string;
  startPoint: string;
  endPoint: string;
  coordinates: [number, number][];
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  confidenceScore: number; // e.g. 94%
  primaryCause: 
    | 'Waterlogging & Heavy Rain' 
    | 'Multi-Vehicle Collision' 
    | 'VIP Motorcade Movement' 
    | 'Metro/Flyover Construction' 
    | 'Heavy Goods Vehicle Breakdown' 
    | 'Unscheduled Protest/March';
  causeDetails: string;
  predictedCongestionTimeMinutes: number;
  normalTravelTimeMinutes: number;
  delayedTravelTimeMinutes: number;
  alternativeRoutes: ComplimentaryRoute[];
}

export interface ComplimentaryRoute {
  id: string;
  name: string;
  coordinates: [number, number][];
  estimatedTimeMinutes: number;
  distanceKm: number;
  trafficLevel: 'CLEAR' | 'LIGHT' | 'MODERATE';
  savingsMinutes: number;
  routeHighlights: string[];
  isRecommended: boolean;
}

export interface EmergencyVehicle {
  id: string;
  type: 'AMBULANCE' | 'FIRE_ENGINE' | 'POLICE_ESCORT';
  plateNumber: string;
  stationName: string;
  destinationHospital: string;
  priority: 'LEVEL_1_CRITICAL' | 'LEVEL_2_URGENT';
  status: 'DISPATCHED' | 'EN_ROUTE' | 'CLEARED' | 'STANDBY';
  currentCoordinates: [number, number];
  destinationCoordinates: [number, number];
  etaMinutes: number;
  assignedZone: string;
  assignedController: string;
  controllerNotified: boolean;
  notifiedAt?: string;
  overrideWaypoints: string[];
  activeSignalCount: number;
  clearedSignalCount: number;
}

export interface PedestrianDetection {
  id: string;
  timestamp: string;
  cameraLocation: string;
  cameraId: string;
  zoneType: 'ZEBRA_CROSSING' | 'JAYWALKING_ROAD_CENTER' | 'HIGH_RISK_BLIND_CURVE' | 'FAST_LANE_TRESPASS';
  riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL_RISK';
  pedestrianCount: number;
  boundingBoxes: {
    x: number; // percentage
    y: number; // percentage
    width: number;
    height: number;
    confidence: number;
    label: string;
    action: string;
  }[];
  vehicleApproachingSpeedKmph: number;
  alertTriggered: boolean;
  description: string;
}

export interface TrafficControllerAlert {
  id: string;
  timestamp: string;
  type: 'EMERGENCY_ARRIVAL' | 'PEDESTRIAN_HAZARD' | 'ROADBLOCK_SPIKE';
  title: string;
  message: string;
  junctionId: string;
  junctionName: string;
  actionRequired: string;
  acknowledged: boolean;
  urgency: 'HIGH' | 'EXTREME' | 'INFO';
}

