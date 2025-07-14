import { globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import ts from 'typescript-eslint'

export default ts.config(
  globalIgnores(['**/*.js', '**/*.cjs'])
, js.configs.recommended
, ...ts.configs.recommended
)
