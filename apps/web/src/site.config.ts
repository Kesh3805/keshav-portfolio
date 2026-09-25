export const site = {
  name: 'Keshav',
  title: 'Keshav — Full-Stack & Systems Engineer',
  headline: 'I build systems and investigate the engineering problems underneath them.',
  description:
    'Engineering portfolio and notebook of Keshav: production backend work on GST compliance, document AI and real-time infrastructure, plus personal systems and AI projects.',
  locale: 'en',
  links: {
    github: 'https://github.com/Kesh3805',
    // Rendered only when set. Fill these in rather than inventing them.
    linkedin: undefined as string | undefined,
    email: undefined as string | undefined,
    resume: undefined as string | undefined,
  },
  stats: [{ value: '83', label: 'public repositories' }],
} as const;

export const nav = [
  { label: 'Work', path: '/work' },
  { label: 'Projects', path: '/projects' },
  { label: 'Writing', path: '/writing' },
  { label: 'About', path: '/about' },
] as const;
