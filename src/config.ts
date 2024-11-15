import { type UseDataSource, type ImmutableObject, type IconResult } from 'jimu-core'

export interface SummaryItemSettingProps {
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
  summaryItems: SummaryItemSettingProps[]
  useDataSourcesMap: { [id: string]: UseDataSource }
  activeItemSetting: SummaryItemSettingProps
}

export type IMConfig = ImmutableObject<Config>
