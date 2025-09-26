import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'GlassBox AI Standard v1.0',
  tagline: 'The Global Operating System for Regulatory Technology',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://glassbox.ai',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/standard/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'glassbox-ai', // Usually your GitHub org/user name.
  projectName: 'glassbox-standard', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/glassbox-ai/glassbox-standard/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/glassbox-ai/glassbox-standard/tree/main/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'GlassBox AI Standard',
      logo: {
        alt: 'GlassBox Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'doc',
          docId: 'regulators/overview',
          position: 'left',
          label: 'For Regulators',
        },
        {
          type: 'doc',
          docId: 'developers/overview',
          position: 'left',
          label: 'For Developers',
        },
        {to: '/docs/tutorial/intro', label: 'Tutorial', position: 'left'},
        {
          href: 'https://github.com/glassbox-ai/glassbox-standard',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'DecisionBundle Spec',
              to: '/docs/specs/decisionbundle',
            },
            {
              label: 'Compliance DSL',
              to: '/docs/specs/compliance-dsl',
            },
            {
              label: 'Tutorial',
              to: '/docs/tutorial/intro',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'For Regulators',
              to: '/docs/regulators/overview',
            },
            {
              label: 'For Developers',
              to: '/docs/developers/overview',
            },
            {
              label: 'SDKs',
              to: '/docs/developers/sdks',
            },
            {
              label: 'Examples',
              to: '/docs/examples/overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/glassbox-ai/glassbox-standard',
            },
            {
              label: 'Issues',
              href: 'https://github.com/glassbox-ai/glassbox-standard/issues',
            },
            {
              label: 'Discussions',
              href: 'https://github.com/glassbox-ai/glassbox-standard/discussions',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} GlassBox AI. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
