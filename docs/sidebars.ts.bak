import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Specifications',
      items: [
        {
          type: 'category',
          label: 'DecisionBundle',
          items: [
            'specs/decisionbundle/overview',
            'specs/decisionbundle/schema',
            'specs/decisionbundle/examples',
          ],
        },
        {
          type: 'category',
          label: 'Compliance DSL',
          items: [
            'specs/compliance-dsl/overview',
            'specs/compliance-dsl/grammar',
            'specs/compliance-dsl/examples',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Tutorial',
      items: [
        'tutorial/intro',
        'tutorial/getting-started',
        'tutorial/creating-rules',
        'tutorial/working-with-bundles',
        'tutorial/advanced-topics',
      ],
    },
    {
      type: 'category',
      label: 'For Regulators',
      items: [
        'regulators/overview',
        'regulators/sandbox',
        'regulators/audit-reports',
        'regulators/best-practices',
      ],
    },
    {
      type: 'category',
      label: 'For Developers',
      items: [
        'developers/overview',
        'developers/sdks',
        'developers/integration',
        'developers/contributing',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/overview',
        'examples/gdpr',
        'examples/aml',
        'examples/healthcare',
        'examples/esg',
      ],
    },
  ],
};

export default sidebars;
