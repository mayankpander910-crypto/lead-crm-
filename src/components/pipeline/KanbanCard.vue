<script setup>
import Select from 'primevue/select'
import StatusTag from '@/components/common/StatusTag.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { PIPELINE_STAGES } from '@/utils/constants'
import { useFormatters } from '@/composables/useFormatters'
import { useCrmStore } from '@/stores/crmStore'

const props = defineProps({
  lead: { type: Object, required: true }
})

const emit = defineEmits(['dragStart', 'dragEnd', 'changeStage'])

const store = useCrmStore()
const { formatCurrency, formatShortDate, isDateOverdue } = useFormatters()

function onNativeDragStart(e) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.lead.id)
  }
  emit('dragStart', props.lead.id)
}
</script>

<template>
  <article
    draggable="true"
    class="group rounded-lg bg-white border border-slate-200/95 p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
    @dragstart="onNativeDragStart"
    @dragend="$emit('dragEnd')"
  >
    <div class="flex items-center justify-between gap-2">
      <StatusTag :value="lead.priority" variant="priority" />
      <span class="text-xs font-bold text-slate-900 tabular-nums">
        {{ formatCurrency(lead.dealValue) }}
      </span>
    </div>

    <button
      type="button"
      class="mt-2.5 block w-full text-left cursor-pointer"
      @click="store.openLeadDetailDrawer(lead.id)"
    >
      <h4
        class="text-[13px] font-semibold text-slate-900 group-hover:underline transition-colors leading-snug truncate"
      >
        {{ lead.name }}
      </h4>
      <p class="mt-0.5 text-xs text-slate-500 truncate">
        {{ lead.company }}
      </p>
    </button>

    <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
      <div class="flex items-center gap-1.5 min-w-0">
        <UserAvatar
          :name="store.getUserName(lead.assignedTo)"
          :color="store.getUserById(lead.assignedTo)?.avatarColor ?? '#64748b'"
          small
        />
        <span class="text-[11px] font-medium text-slate-600 truncate">
          {{ store.getUserName(lead.assignedTo).split(' ')[0] }}
        </span>
      </div>

      <span
        v-if="lead.nextFollowUp"
        class="text-[11px] tabular-nums shrink-0"
        :class="
          lead.status !== 'Won' &&
          lead.status !== 'Lost' &&
          isDateOverdue(lead.nextFollowUp)
            ? 'text-rose-600 font-semibold'
            : 'text-slate-400'
        "
      >
        <i class="pi pi-calendar text-[10px] mr-0.5" />
        {{ formatShortDate(lead.nextFollowUp) }}
      </span>
    </div>

    <div class="mt-2.5" @click.stop>
      <Select
        :model-value="lead.status"
        :options="PIPELINE_STAGES"
        size="small"
        aria-label="Change pipeline stage"
        class="w-full !text-[11px] !rounded-md !bg-slate-50/80"
        :pt="{
          label: { class: '!py-1 !px-2.5 !text-[11px] font-medium text-slate-600' },
          dropdown: { class: '!w-7' }
        }"
        @update:model-value="(val) => $emit('changeStage', lead.id, val)"
      />
    </div>
  </article>
</template>
