# WBDM Format (version 1)

All bytes are little-endian.

### 1. Layout

[HEADER]
[EVENT]
[EVENT]
...
[EVENT]

### 2. Details

- HEADER: [WBDM][01][00000000]

  | OFFSET | SIZE | FIELD        | Description         |
  | ------ | ---- | ------------ | ------------------- |
  | 0      | 4    | magic string | WBDM                |
  | 4      | 1    | version      | u8                  |
  | 5      | 8    | base time    | u64 (Unix epoch ms) |

- EVENT: [TYPE AND ACTION][DELTA TIME] ...
  - STROKE: [ID] ...
    - START: [COLOR][WIDTH][X COORD][Y COORD]
    - MOVE : [X COORD][Y COORD]
    - END, INSERT, DELETE: No additional payload
  - ...

### 3. Opcodes

Each event's type and action are packed into a single byte. The upper 4 bits represent the event type, and the lower 4 bits represent the action.

For example, `0001 0000` (`0x10`) represents Type `0x1` and Action `0x0`.

**Opcode lookup table:**

| Bits 7–4 | Bits 3–0 | Description                 |
| -------- | -------- | --------------------------- |
| Type     | Action   | Event type and action codes |
| 0001     | 0000     | stroke.start                |
| 0001     | 0001     | stroke.move                 |
| 0001     | 0010     | stroke.end                  |
| 0001     | 0011     | stroke.insert               |
| 0001     | 0100     | stroke.delete               |

Note: Each type supports up to 16 actions. If more are needed, the
opcode encoding must be extended or redesigned.

### 4. Example

1.  Dot
    | Offset   | Hexadecimal bytes                               |
    | -------- | ----------------------------------------------- |
    | 00000000 | 57 42 44 4d 01 21 eb 59 31 a1 01 00 00 10 67 01 |
    | 00000010 | 00 00 01 00 00 00 01 0a ab 2a 88 42 ab aa 16 42 |
    | 00000020 | 12 b0 01 00 00 01 00 00 00                      |

Explanation

- Header

  - 57 42 44 4d: Magic bytes identifying the file as WBDM.

  - 01: Format version 1.

  - 21 eb 59 31 a1 01 00 00: Base timestamp, encoded as an unsigned 64-bit little-endian integer.

- Event data

  - 01: Opcode (stroke.start).

  - 00 00 10 67 01 ...: Remaining event data, decoded according to the event format.
