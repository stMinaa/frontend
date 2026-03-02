module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  
  plugins: [
    'import',
    'boundaries'
  ],
  
  settings: {
    'boundaries/elements': [
      {
        type: 'components',
        pattern: 'src/components/**/*',
        mode: 'full'
      },
      {
        type: 'pages',
        pattern: 'src/*Dashboard.js',
        mode: 'full'
      },
      {
        type: 'router',
        pattern: 'src/Dashboard.js',
        mode: 'full'
      },
      {
        type: 'services',
        pattern: 'src/services/**/*',
        mode: 'full'
      },
      {
        type: 'hooks',
        pattern: 'src/hooks/**/*',
        mode: 'full'
      },
      {
        type: 'utils',
        pattern: 'src/utils/**/*',
        mode: 'full'
      },
      {
        type: 'root',
        pattern: 'src/{App,index}.js',
        mode: 'full'
      }
    ],
    'boundaries/ignore': [
      'src/**/*.test.js',
      'src/**/*.spec.js'
    ]
  },
  
  rules: {
    // ═══════════════════════════════════════════
    // REACT HOOKS RULES (CRITICAL!)
    // ═══════════════════════════════════════════
    
    // Enforce Rules of Hooks
    'react-hooks/rules-of-hooks': 'error',
    
    // Enforce exhaustive dependencies in hooks
    'react-hooks/exhaustive-deps': 'error',
    
    // ═══════════════════════════════════════════
    // IMPORT RULES
    // ═══════════════════════════════════════════
    
    // Enforce consistent import ordering
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'pathGroups': [
        {
          pattern: 'react',
          group: 'external',
          position: 'before'
        }
      ],
      'pathGroupsExcludedImportTypes': ['react'],
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      }
    }],
    
    // Prevent circular dependencies
    'import/no-cycle': ['error', {
      maxDepth: Infinity,
      ignoreExternal: true
    }],
    
    // ═══════════════════════════════════════════
    // ARCHITECTURAL BOUNDARY RULES
    // ═══════════════════════════════════════════
    
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        // Components can import other components, hooks, and utils
        {
          from: ['components'],
          allow: ['components', 'hooks', 'utils']
        },
        
        // Pages (Dashboards) can import everything except root
        {
          from: ['pages'],
          allow: ['components', 'services', 'hooks', 'utils']
        },
        
        // Services can only import utils (keep them pure)
        {
          from: ['services'],
          allow: ['utils']
        },
        
        // Hooks can import services and utils
        {
          from: ['hooks'],
          allow: ['services', 'utils', 'hooks']
        },
        
        // Utils can only import other utils
        {
          from: ['utils'],
          allow: ['utils']
        },
        
        // Router (Dashboard.js) can import pages, components, hooks, utils
        {
          from: ['router'],
          allow: ['pages', 'components', 'hooks', 'utils']
        },

        // Root (App.js, index.js) can import everything including root
        {
          from: ['root'],
          allow: ['root', 'router', 'components', 'pages', 'services', 'hooks', 'utils']
        }
      ]
    }],
    
    // ═══════════════════════════════════════════
    // CODE QUALITY RULES
    // ═══════════════════════════════════════════
    
    // Component/function size limits
    'max-lines': ['error', {
      max: 250,
      skipBlankLines: true,
      skipComments: true
    }],
    'max-lines-per-function': ['error', {
      max: 50,
      skipBlankLines: true,
      skipComments: true
    }],
    
    // Complexity limits
    'complexity': ['error', { max: 10 }],
    'max-depth': ['error', { max: 3 }],
    
    // React-specific best practices
    'react/jsx-no-bind': ['warn', {
      allowArrowFunctions: true,
      allowFunctions: false,
      allowBind: false
    }],
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    'react/prop-types': 'off', // Turn off if not using PropTypes
    
    // General best practices
    'no-console': ['warn', {
      allow: ['error', 'warn']
    }],
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'prefer-const': 'error',
    'no-var': 'error'
  },
  
  overrides: [
    // Relax rules for test files
    {
      files: ['**/*.test.js', '**/*.spec.js', 'src/setupTests.js'],
      rules: {
        'max-lines-per-function': 'off',
        'max-lines': 'off',
        'no-console': 'off'
      }
    },
    
    // Relax rules for service worker (including CRA-generated serviceWorkerRegistration.js)
    {
      files: ['src/serviceWorker.js', 'src/service-worker.js', 'src/serviceWorkerRegistration.js'],
      rules: {
        'max-lines': 'off',
        'no-console': 'off'
      }
    }
  ]
};
