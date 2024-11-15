import { type UseDataSource, type ImmutableObject, type IconResult } from 'jimu-core'

export interface DSConfig {
  id: string
  dataSourceId: string
  label: string
  icon: IconResult
  showCount: boolean
  showList: boolean
  fields: string[]
  groupField: string[]
  featureIconType: number
}

export interface Config {
  showSearch: boolean
  dsConfigs: DSConfig[]
  useDataSourcesMap: { [id: string]: UseDataSource }
  activeDSConfig: DSConfig
}

export type IMConfig = ImmutableObject<Config>
