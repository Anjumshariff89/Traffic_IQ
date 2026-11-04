import { TrafficSignal, RoadblockPrediction, EmergencyVehicle, PedestrianDetection, TrafficControllerAlert } from '../types/traffic';

// Initial Signal Network
export const initialSignals: TrafficSignal[] = [
  {
    id: 'SIG-101',
    name: 'Sector 62 Crossway - North Post',
    junction: 'Expressway Interchange A',
    currentStatus: 'GREEN',
    timeRemaining: 24,
    redDuration: 55,
    yellowDuration: 5,
    greenDuration: 40,
    coordinates: [28.6280, 77.3649],
    distanceFromUserMeters: 280,
    recommendedSpeedKmph: 45,
    emergencyOverridden: false,
  },
  {
    id: 'SIG-102',
    name: 'Central Avenue - Cyber Hub Junction',
    junction: 'Corridor Post 4',
    currentStatus: 'RED',
    timeRemaining: 18,
    redDuration: 45,
    yellowDuration: 4,
    greenDuration: 35,
    coordinates: [28.6342, 77.3712],
    distanceFromUserMeters: 950,
    recommendedSpeedKmph: 38,
    emergencyOverridden: false,
  },
  {
    id: 'SIG-103',
    name: 'Metro Line Circle - Outer Ring',
    junction: 'Terminal Roundabout',
    currentStatus: 'YELLOW',
    timeRemaining: 3,
    redDuration: 50,
    yellowDuration: 5,
    greenDuration: 45,
    coordinates: [28.6410, 77.3820],
    distanceFromUserMeters: 1750,
    recommendedSpeedKmph: 50,
    emergencyOverridden: false,
  },
  {
    id: 'SIG-104',
    name: 'Apollo Hospital Access Gate',
    junction: 'Medical Emergency Corridor Point 1',
    currentStatus: 'RED',
    timeRemaining: 32,
    redDuration: 60,
    yellowDuration: 5,
    greenDuration: 30,
    coordinates: [28.6495, 77.3910],
    distanceFromUserMeters: 2600,
    recommendedSpeedKmph: 40,
    emergencyOverridden: false,
  },
  {
    id: 'SIG-105',
    name: 'South Fire Sub-station Crossing',
    junction: 'Hazard Response Lane B',
    currentStatus: 'GREEN',
    timeRemaining: 15,
    redDuration: 40,
    yellowDuration: 4,
    greenDuration: 35,
    coordinates: [28.6210, 77.3550],
    distanceFromUserMeters: 3400,
    recommendedSpeedKmph: 52,
    emergencyOverridden: false,
  }
];

// Predictive Roadblocks with Detected Causes and Complimentary Routes
export const initialRoadblocks: RoadblockPrediction[] = [
  {
    id: 'RB-901',
    roadName: 'Grand Trunk Expressway (Northbound)',
    startPoint: 'Mile Marker 14 - Flyover Ramp',
    endPoint: 'Tech Park Toll Plaza',
    coordinates: [
      [28.6300, 77.3620],
      [28.6335, 77.3680],
      [28.6380, 77.3740],
    ],
    severity: 'CRITICAL',
    confidenceScore: 96,
    primaryCause: 'Multi-Vehicle Collision',
    causeDetails: 'A 3-car pileup blocked lanes 1 & 2 right below the pedestrian footbridge. Traffic is bottlenecked to a single service lane. Towing recovery vehicle dispatched 6 mins ago.',
    predictedCongestionTimeMinutes: 45,
    normalTravelTimeMinutes: 8,
    delayedTravelTimeMinutes: 52,
    alternativeRoutes: [
      {
        id: 'ALT-1',
        name: 'Complimentary Route A: Canal Service Link Rd (Via Sector 58 Bypass)',
        coordinates: [
          [28.6280, 77.3590],
          [28.6350, 77.3580],
          [28.6430, 77.3710],
        ],
        estimatedTimeMinutes: 14,
        distanceKm: 6.2,
        trafficLevel: 'CLEAR',
        savingsMinutes: 38,
        routeHighlights: ['Completely avoids bottleneck', 'Synchronized green wave signals', 'Toll-free lane open'],
        isRecommended: true
      },
      {
        id: 'ALT-2',
        name: 'Complimentary Route B: Ring Arterial Underpass',
        coordinates: [
          [28.6260, 77.3680],
          [28.6320, 77.3790],
          [28.6420, 77.3810],
        ],
        estimatedTimeMinutes: 19,
        distanceKm: 7.8,
        trafficLevel: 'LIGHT',
        savingsMinutes: 33,
        routeHighlights: ['Multi-lane boulevard', 'Heavy commercial ban until 21:00'],
        isRecommended: false
      }
    ]
  },
  {
    id: 'RB-902',
    roadName: 'Riverbank Causeway & Lowland Road',
    startPoint: 'Old Barrage Bridge',
    endPoint: 'Industrial Sector 64',
    coordinates: [
      [28.6450, 77.3850],
      [28.6480, 77.3910],
      [28.6520, 77.3980],
    ],
    severity: 'HIGH',
    confidenceScore: 92,
    primaryCause: 'Waterlogging & Heavy Rain',
    causeDetails: 'Sudden high-intensity storm caused 1.8 feet stormwater accumulation across 400m span. Sensor gauge #4 indicates drainage overflow. Low-slung sedans experiencing engine stalls.',
    predictedCongestionTimeMinutes: 90,
    normalTravelTimeMinutes: 12,
    delayedTravelTimeMinutes: 65,
    alternativeRoutes: [
      {
        id: 'ALT-3',
        name: 'Complimentary Route: High-Elevation Overpass (Elevated Corridor)',
        coordinates: [
          [28.6420, 77.3800],
          [28.6490, 77.3820],
          [28.6560, 77.3940],
        ],
        estimatedTimeMinutes: 16,
        distanceKm: 5.4,
        trafficLevel: 'CLEAR',
        savingsMinutes: 49,
        routeHighlights: ['100% elevated above flood zone', 'Clear radar sensors', 'No waterlogging risk'],
        isRecommended: true
      }
    ]
  },
  {
    id: 'RB-903',
    roadName: 'Governor Boulevard & Diplomatic Enclave',
    startPoint: 'State Secretariat Gate 3',
    endPoint: 'Convention Center Cross',
    coordinates: [
      [28.6180, 77.3500],
      [28.6220, 77.3560],
    ],
    severity: 'MODERATE',
    confidenceScore: 89,
    primaryCause: 'VIP Motorcade Movement',
    causeDetails: 'High-security convoy transition scheduled. Traffic halted temporarily at intersecting nodes. Intermittent hold times between 8-15 minutes.',
    predictedCongestionTimeMinutes: 25,
    normalTravelTimeMinutes: 6,
    delayedTravelTimeMinutes: 28,
    alternativeRoutes: [
      {
        id: 'ALT-4',
        name: 'Complimentary Route: Heritage Avenue Outer Parallel Loop',
        coordinates: [
          [28.6150, 77.3480],
          [28.6200, 77.3450],
          [28.6270, 77.3530],
        ],
        estimatedTimeMinutes: 9,
        distanceKm: 3.8,
        trafficLevel: 'LIGHT',
        savingsMinutes: 19,
        routeHighlights: ['Unrestricted civilian corridor', 'All traffic lights functioning on normal duty'],
        isRecommended: true
      }
    ]
  }
];

// Active Emergency Vehicles in City Fleet
export const initialEmergencies: EmergencyVehicle[] = [
  {
    id: 'EMG-AMB-01',
    type: 'AMBULANCE',
    plateNumber: 'MED-EMG-9942',
    stationName: 'Fortis Trauma Care Unit 3',
    destinationHospital: 'City General Super-Speciality Hospital',
    priority: 'LEVEL_1_CRITICAL',
    status: 'EN_ROUTE',
    currentCoordinates: [28.6250, 77.3600],
    destinationCoordinates: [28.6510, 77.3950],
    etaMinutes: 4.2,
    assignedZone: 'Sector 62 to East Medical Hub',
    assignedController: 'Officer D. Sharma (Station 6 Control Desk)',
    controllerNotified: true,
    notifiedAt: 'Just now (Auto Beacon Active)',
    overrideWaypoints: ['SIG-101', 'SIG-102', 'SIG-104'],
    activeSignalCount: 3,
    clearedSignalCount: 1,
  },
  {
    id: 'EMG-FIRE-07',
    type: 'FIRE_ENGINE',
    plateNumber: 'FIRE-RES-401',
    stationName: 'Central District Fire Headquarter',
    destinationHospital: 'Commercial Complex Blaze (Block C)',
    priority: 'LEVEL_1_CRITICAL',
    status: 'DISPATCHED',
    currentCoordinates: [28.6200, 77.3520],
    destinationCoordinates: [28.6430, 77.3820],
    etaMinutes: 6.8,
    assignedZone: 'Central Ring Highway',
    assignedController: 'Officer R. Verma (Central Grid Dispatch)',
    controllerNotified: true,
    notifiedAt: '1 min ago',
    overrideWaypoints: ['SIG-105', 'SIG-101', 'SIG-103'],
    activeSignalCount: 3,
    clearedSignalCount: 0,
  }
];

// Real-time AI Pedestrian Detection Feeds
export const initialPedestrianDetections: PedestrianDetection[] = [
  {
    id: 'PED-CAM-401',
    timestamp: 'Live Feed - Just now',
    cameraLocation: 'Expressway Sector 62 underpass junction',
    cameraId: 'AI-CAM-S62-09',
    zoneType: 'JAYWALKING_ROAD_CENTER',
    riskLevel: 'CRITICAL_RISK',
    pedestrianCount: 2,
    boundingBoxes: [
      { x: 38, y: 46, width: 14, height: 38, confidence: 0.97, label: 'Pedestrian #1 (Jaywalking)', action: 'Crossing 4-lane fast highway outside crosswalk' },
      { x: 55, y: 50, width: 13, height: 34, confidence: 0.94, label: 'Pedestrian #2 (Hazard zone)', action: 'Standing on highway divider median edge' }
    ],
    vehicleApproachingSpeedKmph: 68,
    alertTriggered: true,
    description: 'AI vision detected two pedestrians crossing unregulated expressway sector. Driver collision warning beacon activated!'
  },
  {
    id: 'PED-CAM-402',
    timestamp: 'Live Feed - 2 sec ago',
    cameraLocation: 'Metro Station Gate 2 pedestrian crosswalk',
    cameraId: 'AI-CAM-METRO-02',
    zoneType: 'ZEBRA_CROSSING',
    riskLevel: 'SAFE',
    pedestrianCount: 4,
    boundingBoxes: [
      { x: 22, y: 55, width: 10, height: 30, confidence: 0.98, label: 'Pedestrian (Valid Crossing)', action: 'Walking within designated zebra stripes' },
      { x: 34, y: 58, width: 11, height: 28, confidence: 0.96, label: 'Pedestrian (Valid Crossing)', action: 'Walking within designated zebra stripes' },
      { x: 62, y: 56, width: 9, height: 31, confidence: 0.99, label: 'Pedestrian with luggage', action: 'Safely on curb ramp' }
    ],
    vehicleApproachingSpeedKmph: 22,
    alertTriggered: false,
    description: 'Pedestrians correctly using zebra crossing during green pedestrian signal. Vehicle deceleration detected.'
  },
  {
    id: 'PED-CAM-403',
    timestamp: 'Live Feed - 4 sec ago',
    cameraLocation: 'Blind curve ramp near Cyber Park flyover',
    cameraId: 'AI-CAM-RAMP-11',
    zoneType: 'HIGH_RISK_BLIND_CURVE',
    riskLevel: 'WARNING',
    pedestrianCount: 1,
    boundingBoxes: [
      { x: 72, y: 40, width: 12, height: 35, confidence: 0.91, label: 'Pedestrian in blind curve', action: 'Jogging along zero-shoulder blind turn' }
    ],
    vehicleApproachingSpeedKmph: 54,
    alertTriggered: true,
    description: 'High risk pedestrian walking along shoulder-less blind curve. Electronic VMS signboard flashing SLOW DOWN.'
  }
];

export const initialControllerAlerts: TrafficControllerAlert[] = [
  {
    id: 'ALR-801',
    timestamp: '18:52:10',
    type: 'EMERGENCY_ARRIVAL',
    title: 'EMERGENCY CORRIDOR ENGAGED - AMBULANCE ARRIVAL',
    message: 'Trauma Unit MED-EMG-9942 approaching Sector 62 Interchange. ETA 3.8 mins. Auto-green wave priority pulse sent to SIG-101 and SIG-102.',
    junctionId: 'SIG-101',
    junctionName: 'Sector 62 Crossway - North Post',
    actionRequired: 'Ensure oncoming cross-traffic remains held at RED until beacon clears.',
    acknowledged: false,
    urgency: 'EXTREME'
  },
  {
    id: 'ALR-802',
    timestamp: '18:51:30',
    type: 'PEDESTRIAN_HAZARD',
    title: 'AI JAYWALKER DETECTED IN HIGH-SPEED ZONE',
    message: '2 individuals stepping into center expressway lanes at KM 14 underpass. Vehicles approaching at 68 km/h.',
    junctionId: 'SIG-102',
    junctionName: 'Central Avenue - Cyber Hub Junction',
    actionRequired: 'Trigger variable message display warning and brief signal hold to prevent high-speed collisions.',
    acknowledged: true,
    urgency: 'HIGH'
  }
];

