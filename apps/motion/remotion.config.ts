import { Config } from '@remotion/cli/config';

// Only used by `remotion studio`; rendering goes through scripts/render.mjs.
Config.setVideoImageFormat('jpeg');
Config.setEntryPoint('src/index.ts');
