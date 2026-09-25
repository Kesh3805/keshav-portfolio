import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import { continueRender, delayRender } from 'remotion';

// Fonts are bundled from @fontsource rather than fetched at render time, so a
// slow network can't time out a render. Frames wait until every face is ready.
const faces = [
  '400 16px "IBM Plex Sans"',
  '500 16px "IBM Plex Sans"',
  '600 16px "IBM Plex Sans"',
  '400 16px "IBM Plex Mono"',
  '500 16px "IBM Plex Mono"',
];

const handle = delayRender('Loading bundled IBM Plex fonts');
Promise.all(faces.map((face) => document.fonts.load(face)))
  .then(() => continueRender(handle))
  .catch((error: unknown) => {
    console.error(error);
    continueRender(handle);
  });
