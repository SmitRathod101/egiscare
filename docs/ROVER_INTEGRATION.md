# EGISCARE — Hardware-Independent Rover Integration Guide

## Hardware Abstraction Layer (HAL)

The rover system is designed to be completely decoupled from physical GPIO pins, specific motor drivers, sensors, cameras, or Raspberry Pi board revisions.

All business and command logic interacts strictly through abstract HAL interfaces defined in `pi-agent/hardware/interfaces.js`:

```js
class MotorController {
  async moveForward(speed) {}
  async moveBackward(speed) {}
  async turnLeft(speed) {}
  async turnRight(speed) {}
  async stop() {}
  async emergencyStop() {}
}
```

---

## Hardware Configuration (`pi-agent/config.json`)

To configure pinouts for your physical Raspberry Pi build, edit `config.json`:

```json
{
  "rover_id": "RVR-001",
  "mode": "rpi",
  "hardware": {
    "motor_driver": "L298N",
    "left_motor_pins": { "en": 12, "in1": 16, "in2": 18 },
    "right_motor_pins": { "en": 13, "in3": 22, "in4": 24 },
    "sensors": {
      "ultrasonic_front": { "trig": 23, "echo": 24 }
    }
  }
}
```

---

## Safety & Emergency Stop Behavior

Emergency Stop (`EMERGENCY_STOP`) is a safety-critical operation:
- Server-side authorization allows caretakers and admins to issue an Emergency Stop immediately.
- The `SafetyHandler` in `pi-agent` cuts motor drive PWM and enters an emergency lockout state.
- Mechanical wheel rotation cannot resume until safety reset is triggered.
