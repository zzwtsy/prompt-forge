import type {
  ProviderSidebarSection,
} from "../types";
import type { ProviderItem } from "@/lib/workbench-api";
import { useState } from "react";

interface UseProviderSidebarSectionDeps {
  providers: ProviderItem[];
}

export function useProviderSidebarSection(deps: UseProviderSidebarSectionDeps): ProviderSidebarSection {
  const { providers } = deps;

  const [providerSearch, setProviderSearch] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const sortedProviders = [...providers].sort((left, right) => {
    if (left.enabled !== right.enabled) {
      return left.enabled ? -1 : 1;
    }

    return left.name.localeCompare(right.name, "zh-CN");
  });

  let activeProviderId: string | null = null;
  if (sortedProviders.length > 0) {
    const selectedProviderStillExists = selectedProviderId !== null
      && sortedProviders.some(provider => provider.id === selectedProviderId);

    activeProviderId = selectedProviderStillExists
      ? selectedProviderId
      : sortedProviders[0].id;
  }

  const selectedProvider = activeProviderId === null
    ? null
    : providers.find(provider => provider.id === activeProviderId) ?? null;

  const keyword = providerSearch.trim().toLowerCase();
  const filteredProviders = keyword.length === 0
    ? sortedProviders
    : sortedProviders.filter((provider) => {
        return provider.name.toLowerCase().includes(keyword)
          || provider.code.toLowerCase().includes(keyword)
          || provider.baseUrl.toLowerCase().includes(keyword);
      });

  return {
    state: {
      providerSearch,
      filteredProviders,
      activeProviderId,
      selectedProvider,
    },
    actions: {
      setProviderSearch,
      selectProvider: setSelectedProviderId,
    },
  };
}
