import { antfu } from '@antfu/eslint-config'

export default antfu({
  rules: {
    'no-console': 'off',
    'unused-imports/no-unused-vars': 'off',
    'node/prefer-global/process': 'off',
    'antfu/no-top-level-await': 'off',
    'node/handle-callback-err': 'off',
  },
  pnpm: true,
})
