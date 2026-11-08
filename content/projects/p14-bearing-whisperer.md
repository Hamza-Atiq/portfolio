---
title: "Can a motor's own current tell that its bearing is failing?"
subtitle: "Bearing Whisperer: bearing fault detection from motor current, tested on bearings the model never saw"
slug: p14-bearing-whisperer
kind: research
status: draft
date: 2026-10
tags: [Electric motors, Condition monitoring]
team: solo
my_role: "Built everything: research, sealed test rounds, model, web app, AMD assistant, demo video"
summary: "Spots damaged bearings from the motor current a drive already measures, and is graded only on bearings it never saw."
result: "0.81 balanced accuracy on unseen bearings (0.95 when the test bearings leak into training); 0.86 against a 2026 paper's best of 0.736, like for like."
cover: { src: images/p14/cover.png, alt: "Diagram: a motor with a damaged bearing, its current wave with a small ripple, and three verdicts: healthy, check bearing, ask a person" }
images:
  - { src: images/p14/hiss.png, alt: "Chart: a worn bearing's current carries about 2.5 dB more high-pitched hiss above 1 kHz than the six healthy bearings" }
  - { src: images/p14/plant.png, alt: "App, Plant page: 32 motors marked check bearing, ask a person, or healthy" }
  - { src: images/p14/motor.png, alt: "App, Motor page: the verdict in words and the motor's hiss picture with its top two signs" }
  - { src: images/p14/note.png, alt: "App, Technician note written by Gemma on AMD, with every number checked in code" }
  - { src: images/p14/shift.png, alt: "App, Plan my shift: the AMD assistant returns an ordered list of motors to visit" }
  - { src: images/p14/proof.png, alt: "App, Proof page: every test round with its results, failures included" }
links:
  code: https://github.com/Hamza-Atiq/bearing-whisperer
  demo: https://bearing-whisperer.vercel.app/
  video: https://bearing-whisperer.vercel.app/demo.mp4
proofs: [amd-act3-certificate]
pin: 2
---
## The problem

In a factory, a failing bearing can stop a motor, and a stopped motor can stop the whole plant. Bearing sensors cost money, so most motors have none. But every motor that runs on a drive already has its **current measured, for free**. Can that current tell a damaged bearing from a healthy one?

## Why I built it

In 2024 I worked at Pak-American Fertilizers, a urea and ammonia plant in Daudkhel, Mianwali (Pakistan). Every week a foreman walked the plant and listened to the motors. If a motor stops the plant, restarting can take more than a week. Only the most important places had backup motors with bearing sensors; most motors had no sensor at all. This project asks whether the current those motors already report could do part of the foreman's job.

I built it alone for the **AMD Developer Hackathon ACT III** (lablab.ai, 12 to 18 October 2026, Track 1 "Intelligent Industry") and completed and submitted it.

## The method

1. **The data.** The public Paderborn University bearing data set: motor current recorded with healthy bearings and with bearings that have real or artificial damage, at several speeds and loads. I also tested a lower, drive-like signal quality (16 kHz, simulated).
2. **An honest test.** Many papers on this data let the model see the test bearings during training. Here every test bearing is one the model has **never seen**. Before each of 4 test rounds, I wrote the rules down and fingerprinted them (SHA-256), so they could not be changed after seeing the results. Every round stays reported, failures included.
3. **The model.** A small random forest that runs on any CPU. It listens for extra high-pitched "hiss" in the current, and it compares each motor with the rest of the fleet.
4. **The app.** A web app for a maintenance technician: which motor to check first. Uncertain motors are handed to a person, and the verdict is given in words, never as a fake percentage.
5. **An assistant that may not invent facts.** Gemma on AMD Token Factory writes the technician's notes and plans the shift with tool calls. Code checks every answer before it is shown: only numbers from the detector, never against the verdict, never "days until failure".

## Results, and how they were measured

Balanced accuracy on bearings the model never saw (0.50 = a coin flip), round 4, which runs the app:

- **Same load:** 0.81 (range 0.66 to 0.93); 0.82 at drive-like quality.
- **Each test condition left out (the published test style):** mean 0.78; 0.81 at drive-like quality.
- **When the test bearings leak into training** (the common shortcut): 0.95. So most of the "about 99%" often reported comes from that shortcut.
- **Like for like with Cekic and Akan (Energies, 2026):** healthy against real wear 0.86, against their best of 0.736. All damage 0.78 with 26% false alarms, against about 0.50 with 85 to 90%. This is not a head-to-head (different models and splits). Without the "compare with the fleet" step the score is 0.72.
- **In the app:** "check bearing" on 69% of 26 damaged motors and on none of the 6 healthy ones; 2 healthy and 4 damaged motors are handed to a person.
- **The assistant:** in a fixed test of 10 questions on 3 motors, 30 of 30 answers passed the code check, and 9 of 9 trick questions (days to failure, which ring, the brand) were declined.

## Limits

- It hears broad hiss above 1 kHz, not the bearing's classic fault notes (0.45 on those alone).
- Bigger damage is not flagged more often (90%, 72% and 44% by damage level).
- Only six healthy bearings exist in the data. A null test matched the real score once in 10 tries, so the results are exploratory.
- It cannot tell which ring is damaged (0.61), so the app says "cannot tell".
- On the data set authors' own split it scores 36% (three answers, about guessing).
- The tested bearing sits on the shaft line, outside the motor, and the drive-like signal quality is simulated.
- The data licence is non-commercial (CC BY-NC 4.0).

Try it: the [live app](https://bearing-whisperer.vercel.app/), the [3-minute demo video](https://bearing-whisperer.vercel.app/demo.mp4), and the [code with every sealed round](https://github.com/Hamza-Atiq/bearing-whisperer).
