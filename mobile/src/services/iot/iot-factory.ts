import { IIoTService, IoTSource } from './types';
import { SimulatorIoTService } from './simulator-iot-service';
import { PhoneSensorIoTService } from './phone-sensor-iot-service';
import { BleIoTService } from './ble-iot-service';

let activeSource: IoTSource = 'simulator';
let activeService: IIoTService | null = null;

export function getIoTService(): IIoTService {
  if (activeService && activeService.source === activeSource) {
    return activeService;
  }
  switch (activeSource) {
    case 'simulator':
      activeService = new SimulatorIoTService();
      break;
    case 'phone':
      activeService = new PhoneSensorIoTService();
      break;
    case 'ble':
      activeService = new BleIoTService();
      break;
  }
  return activeService;
}

export function setActiveIoTSource(source: IoTSource): void {
  if (source === activeSource) return;
  if (activeService) {
    activeService.disconnect().catch(() => {});
  }
  activeSource = source;
  activeService = null;
}

export function getActiveIoTSource(): IoTSource {
  return activeSource;
}