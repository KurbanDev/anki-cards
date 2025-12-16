<template>
  <Teleport to="body">
    <Transition

    >
      <div
          v-if="isShow"
          class="fixed inset-0 z-50 bg-black/80 "
          @click.self="$emit('update:isShow', false)"
      >
        <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 rounded-xl
                    m:top-0 m:left-0 m:translate-0  m:rounded-none m:border-none">
          <div class="">
            <slot name="header"/>
            <div
                @click="$emit('update:isShow', false)"
                class="absolute right-2 top-2 cursor-pointer hover:opacity-50 p-2">
              <X/>
            </div>
          </div>
          <div class=" ">
            <slot/>
          </div>
          <div v-if="$slots.footer" class="flex flex-col-reverse">
            <slot name="footer"/>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import {X} from 'lucide-vue-next'

defineProps({
  isShow: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:isShow'])
</script>

