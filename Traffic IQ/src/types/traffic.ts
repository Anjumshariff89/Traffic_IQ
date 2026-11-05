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
  isVerified?: boolean;
  verifiedBy?: string;
  status?: 'ACTIVE' | 'RESOLVING' | 'CLEARED';
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

export type UserRole = 'CITIZEN' | 'OPERATOR' | 'RESPONDER' | 'ADMIN';

export interface RolePermissions {
  canViewAllModules: boolean;
  canReportIncident: boolean;
  canVerifyIncident: boolean;
  canOverrideSignals: boolean;
  canDispatchEmergency: boolean;
  canClearEmergencyCorridor: boolean;
  canUpdateResponseStatus: boolean;
  canManagePermissions: boolean;
}

export interface RoleDefinition {
  id: UserRole;
  label: string;
  shortName: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  permissions: RolePermissions;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  CITIZEN: {
    id: 'CITIZEN',
    label: 'Citizen',
    shortName: 'Citizen',
    badge: 'Commuter / Driver',
    badgeBg: 'bg-[#E8F0FE]',
    badgeText: 'text-[#1A73E8]',
    description: 'City commuter viewing traffic conditions, alternative detours, alerts, and reporting road hazards.',
    permissions: {
      canViewAllModules: true,
      canReportIncident: true,
      canVerifyIncident: false,
      canOverrideSignals: false,
      canDispatchEmergency: false,
      canClearEmergencyCorridor: false,
      canUpdateResponseStatus: false,
      canManagePermissions: false,
    }
  },
  OPERATOR: {
    id: 'OPERATOR',
    label: 'Traffic Operator',
    shortName: 'Operator',
    badge: 'Traffic Command Desk',
    badgeBg: 'bg-[#FEF7E0]',
    badgeText: 'text-[#B06000]',
    description: 'Control center operator verifying incidents, managing AI bottlenecks, and coordinating traffic signals.',
    permissions: {
      canViewAllModules: true,
      canReportIncident: true,
      canVerifyIncident: true,
      canOverrideSignals: true,
      canDispatchEmergency: true,
      canClearEmergencyCorridor: true,
      canUpdateResponseStatus: true,
      canManagePermissions: false,
    }
  },
  RESPONDER: {
    id: 'RESPONDER',
    label: 'Emergency Responder',
    shortName: 'Responder',
    badge: 'Paramedic / Fire Response',
    badgeBg: 'bg-[#FCE8E6]',
    badgeText: 'text-[#D93025]',
    description: 'Ambulance or Fire crew member tracking assigned incidents, green corridors, and updating mission status.',
    permissions: {
      canViewAllModules: true,
      canReportIncident: true,
      canVerifyIncident: false,
      canOverrideSignals: false,
      canDispatchEmergency: true,
      canClearEmergencyCorridor: true,
      canUpdateResponseStatus: true,
      canManagePermissions: false,
    }
  },
  ADMIN: {
    id: 'ADMIN',
    label: 'City Administrator',
    shortName: 'Admin',
    badge: 'Municipal Oversight',
    badgeBg: 'bg-[#E6F4EA]',
    badgeText: 'text-[#188038]',
    description: 'Municipal authority monitoring city-wide analytics, incident audit logs, and security permissions.',
    permissions: {
      canViewAllModules: true,
      canReportIncident: true,
      canVerifyIncident: true,
      canOverrideSignals: true,
      canDispatchEmergency: true,
      canClearEmergencyCorridor: true,
      canUpdateResponseStatus: true,
      canManagePermissions: true,
    }
  }
};

export interface IncidentReport {
  id: string;
  timestamp: string;
  reportedByRole: UserRole;
  reporterName: string;
  category: 'ACCIDENT' | 'WATERLOGGING' | 'ROADWORK' | 'HAZARD';
  title: string;
  location: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'RESOLVED';
  upvotes: number;
}


