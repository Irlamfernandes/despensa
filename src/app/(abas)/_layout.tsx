import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { criarLog } from '@/log';

const log = criarLog('abas');

export default function LayoutDasAbas() {
  log.info('montando abas');
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Resumo</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="dashboard" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="compras">
        <NativeTabs.Trigger.Label>Compras</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="shopping_cart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="produtos">
        <NativeTabs.Trigger.Label>Produtos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="inventory_2" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
