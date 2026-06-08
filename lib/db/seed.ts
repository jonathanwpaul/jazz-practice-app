import type { DataSource } from "typeorm";

export async function seed(ds: DataSource): Promise<void> {
  const qr = ds.createQueryRunner();
  try {
    const [{ cnt }] = await qr.query("SELECT COUNT(*) as cnt FROM categories");
    if (Number(cnt) > 0) return;

    await qr.query(`
      INSERT INTO categories (id, name, monthly_target, sort_order) VALUES
        (1, 'Improvising',    16, 1),
        (2, 'Technique',      16, 2),
        (3, 'Piano Standards', 8, 3),
        (4, 'Jazz Piano',      6, 4)
    `);

    await qr.query(`
      INSERT INTO rates (id, name, value) VALUES
        (1, 'Daily',        7),
        (2, '3× per week',  3),
        (3, '2× per week',  2),
        (4, 'Weekly',       1)
    `);

    // category_id 1 = P1, 2 = P2, 3 = P3, 4 = P4
    // rate_id 1 = Daily, 2 = 3×/wk, 3 = 2×/wk, 4 = Weekly, NULL = per_song
    await qr.query(`
      INSERT INTO tasks (name, category_id, rate_id, per_song, required, description) VALUES
        -- P1 · Improvising
        ('Listen to three recordings',             1, NULL, 1, 0, 'Before opening a chart. Listen for phrase shape, form length, and tension/resolution. Three versions: classic, vocal, contemporary.'),
        ('Map the form and key centers',           1, NULL, 1, 0, 'Draw the form on paper. Label each section, count bars, circle every II–V–I. Write the key center over each section.'),
        ('Sing root movement',                     1,    1, 0, 1, 'Sing the root of every chord as it changes. Then play roots in left hand while singing. Then play on alto with iReal Pro backing.'),
        ('Guide-tone line',                        1,    2, 0, 0, 'Voice-lead 3rds and 7ths through the form. Find the smoothest path — common tones stay, others move by step. Play on piano then horn.'),
        ('Transcribe a phrase',                    1,    3, 0, 0, 'Pick 4–8 bars from a recording. Transcribe by ear to piano first, then to horn, then write it out. Target: Cannonball for alto.'),
        ('Transpose a transcribed phrase',         1,    3, 0, 0, 'Take a transcribed phrase and play it in at least two other keys. Aim for all 12 eventually.'),
        ('Restricted improv — scale tones only',   1,    2, 0, 0, 'Improvise using only scale tones (no chromatic). Forces you to hear the harmony before embellishing it.'),
        ('Improv with transcribed phrase as anchor', 1,  3, 0, 0, 'Use a transcribed phrase as the seed of each chorus. Start there, depart, return. Builds vocabulary retention.'),
        ('Full performance — head solos head',     1,    4, 0, 0, 'Play the full tune: melody in, improvise at least one chorus, melody out. Record it.'),
        ('Chromatic approach notes',               1,    3, 0, 0, 'Add chromatic approach notes (half-step above or below) before chord tones. Apply to existing phrases.'),
        ('Bebop dominant scale',                   1,    3, 0, 0, 'The dominant bebop scale adds a chromatic passing tone between b7 and the root. Practice over every dominant chord in the tune.'),

        -- P2 · Technique
        ('Long tones',                             2,    1, 0, 1, 'Hold each note 8 counts: stable pitch, full tone, no wavering. Low Bb to high D. Tune to a drone. Non-negotiable every session.'),
        ('Scale of the day',                       2,    1, 0, 0, 'One major key per session, two octaves, both directions. Rotate through all 12. Add dorian and mixolydian once majors are solid.'),
        ('Scale patterns — thirds and fourths',    2,    2, 0, 0, 'Play your scale in diatonic thirds, then fourths. Builds finger independence and intervallic ear training simultaneously.'),
        ('Cold sight-read',                        2,    1, 0, 0, 'Open a book of etudes or big band parts to a random page. Play it once at tempo, no preview. Track where you stumble.'),
        ('Awkward fingering drills',               2,    3, 0, 0, 'Isolate passages that trip you up — palm keys, side keys, bis Bb. Loop them slowly until clean, then up to tempo.'),
        ('Overtone exercises',                     2,    2, 0, 0, 'Finger low Bb, overblow to get the overtone series. Work up to the 4th or 5th overtone. Builds embouchure control and altissimo foundation.'),
        ('Altissimo note practice',                2,    4, 0, 0, 'Only after overtones are stable. Work altissimo fingerings chromatically from high F#. Goal: clean altissimo to high G.'),

        -- P3 · Piano Standards
        ('Read a piano arrangement',               3, NULL, 1, 0, 'Read through a published piano arrangement of the current standard. No jazz editing yet — just read it as written to internalize the melody and harmony.'),
        ('Root and melody on piano',               3,    2, 0, 0, 'Play the melody in the right hand with root notes in the left. Sing the melody while playing. Work from memory, not the chart.'),
        ('Shell voicings through the form',        3,    2, 0, 0, 'Left hand plays 1–3–7 or 1–7–3 shell voicings through the entire form. Voice-lead smoothly. Right hand plays the melody.'),
        ('Stride-lite bass pattern',               3,    3, 0, 0, 'Left hand alternates root on beat 1, shell voicing on beats 2–3–4 (waltz) or 2 and 4 (swing). Builds left-hand independence.'),
        ('Solo piano performance',                 3,    4, 0, 0, 'Full performance: melody, some improvisation, melody out — piano only. Record it. A friend should be able to name the song.'),
        ('Maintenance run-through',                3,    4, 0, 0, 'Pick a standard you have previously worked through and play it from memory on piano and/or horn. No chart unless stuck.'),

        -- P4 · Jazz Piano Language
        ('Rootless voicings — Type A and B',       4,    2, 0, 0, 'For each chord quality (maj7, min7, dom7), learn Type A and Type B rootless voicings. Voice-lead through II–V–I with left hand only.'),
        ('Comping rhythm and jazz placement',      4,    2, 0, 0, 'Practice syncopated chord placements: the ''and'' of 2, the ''and'' of 4. Avoid landing on beats 1 and 3. Record and listen back.'),
        ('Left-hand independence drill',           4,    3, 0, 0, 'Comp with left hand (rootless voicings, syncopated) while right hand plays a fixed melody or scale pattern. The hands should not synchronise.'),
        ('Transcribe comping rhythm',              4,    3, 0, 0, 'Pick 8–16 bars of piano comping from a recording (Wynton Kelly, Bill Evans). Write out exactly where each chord lands relative to the beat.'),
        ('Extended voicings — 9ths, 13ths, altered', 4,  3, 0, 0, 'Add 9ths and 13ths to your voicings. For dominant chords, practice the altered scale voicing (b9, #9, b13). Apply to a II–V–I.')
    `);

    await qr.query(`
      INSERT INTO songs (name, status) VALUES
        ('Billie''s Bounce',                'not_started'),
        ('Now''s the Time',                 'not_started'),
        ('Autumn Leaves',                   'not_started'),
        ('All of Me',                       'not_started'),
        ('There Will Never Be Another You', 'not_started'),
        ('Summertime',                      'not_started'),
        ('Mr. P.C.',                        'not_started'),
        ('Oleo',                            'not_started'),
        ('Misty',                           'not_started'),
        ('Alone Together',                  'not_started'),
        ('Confirmation',                    'not_started'),
        ('All the Things You Are',          'not_started'),
        ('Round Midnight',                  'not_started'),
        ('So What / Impressions',           'not_started'),
        ('Giant Steps',                     'not_started')
    `);
  } finally {
    await qr.release();
  }
}
