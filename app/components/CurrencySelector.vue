<template>
  <div class="currency-selector">
    <select v-model="selected" @change="changeCurrency" class="currency-select">
      <option
        v-for="currency in currencies"
        :key="currency.code"
        :value="currency.code"
      >
        {{ currency.code }} - {{ currency.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useCurrency } from "~/composables/useCurrency";

const { supportedCurrencies, selectedCurrency, setCurrency } = useCurrency();

const selected = ref(selectedCurrency.value);
const currencies = supportedCurrencies;

const changeCurrency = () => {
  setCurrency(selected.value);
};

watch(selectedCurrency, (newVal) => {
  selected.value = newVal;
});
</script>

<style scoped>
.currency-selector {
  display: flex;
  align-items: center;
}

.currency-select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.currency-select:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.currency-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
