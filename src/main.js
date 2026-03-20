// Forge core styles
import '@tylertech/forge/dist/forge-core.css';
import '@tylertech/forge/dist/forge.css';

// Forge component definitions
import {
  defineAppBarComponent,
  defineAppBarMenuButtonComponent,
  defineAppBarSearchComponent,
  defineScaffoldComponent,
  defineCardComponent,
  defineButtonComponent,
  defineIconComponent,
  defineIconButtonComponent,
  defineAvatarComponent,
  defineButtonToggleComponent,
  defineButtonToggleGroupComponent,
  defineDialogComponent,
  defineSplitViewComponent,
  defineSplitViewPanelComponent,
  defineTableComponent,
  defineToolbarComponent,
  defineChipComponent,
} from '@tylertech/forge';

// Tyler Icons
import { IconRegistry } from '@tylertech/forge';
import {
  tylIconHome,
  tylIconSearch,
  tylIconAdd,
  tylIconMenu,
  tylIconHelpOutline,
  tylIconNotifications,
  tylIconSend,
  tylIconDatabaseOutline,
  tylIconArrowDropDown,
  tylIconClose,
  tylIconBarChart,
  tylIconOpenInNew,
  tylIconFileDownload,
  tylIconShare,
  tylIconPieChart,
  tylIconInsertChart,
  tylIconAutoAwesome,
  tylIconMoreVert,
  tylIconMic,
  tylIconFilterList,
  tylIconCode,
  tylIconGridView,
  tylIconInfoOutline,
  tylIconLink,
  tylIconContentCopy,
  tylIconCheck,
  tylIconArrowBack,
  tylIconSave,
  tylIconPlayArrow,
  tylIconPerson,
  tylIconSchedule,
  tylIconFolder,
} from '@tylertech/tyler-icons';

// Define components
defineAppBarComponent();
defineAppBarMenuButtonComponent();
defineAppBarSearchComponent();
defineScaffoldComponent();
defineCardComponent();
defineButtonComponent();
defineIconComponent();
defineIconButtonComponent();
defineAvatarComponent();
defineButtonToggleComponent();
defineButtonToggleGroupComponent();
defineDialogComponent();
defineSplitViewComponent();
defineSplitViewPanelComponent();
defineTableComponent();
defineToolbarComponent();
defineChipComponent();

// Register icons
IconRegistry.define([
  tylIconHome,
  tylIconSearch,
  tylIconAdd,
  tylIconMenu,
  tylIconHelpOutline,
  tylIconNotifications,
  tylIconSend,
  tylIconDatabaseOutline,
  tylIconArrowDropDown,
  tylIconClose,
  tylIconBarChart,
  tylIconOpenInNew,
  tylIconFileDownload,
  tylIconShare,
  tylIconPieChart,
  tylIconInsertChart,
  tylIconAutoAwesome,
  tylIconMoreVert,
  tylIconMic,
  tylIconFilterList,
  tylIconCode,
  tylIconGridView,
  tylIconInfoOutline,
  tylIconLink,
  tylIconContentCopy,
  tylIconCheck,
  tylIconArrowBack,
  tylIconSave,
  tylIconPlayArrow,
  tylIconPerson,
  tylIconSchedule,
  tylIconFolder,
]);

// Forge AI components (Lit-based, self-register on import)
import '@tylertech/forge-ai/ai-prompt';
import '@tylertech/forge-ai/ai-suggestions';
import '@tylertech/forge-ai/ai-chat-interface';
import '@tylertech/forge-ai/ai-user-message';
import '@tylertech/forge-ai/ai-response-message';
import '@tylertech/forge-ai/ai-thinking-indicator';
import '@tylertech/forge-ai/ai-chatbot';

// Chat flow
import { openChatFlow, openLibraryView } from './chat-flow.js';

// Wire suggestion buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.suggestion-btn[data-suggestion]').forEach(btn => {
    btn.addEventListener('click', () => {
      openChatFlow(Number(btn.dataset.suggestion));
    });
  });

  // Wire library button
  const libraryBtn = document.querySelector('#library-btn');
  if (libraryBtn) {
    libraryBtn.addEventListener('click', () => {
      openLibraryView();
    });
  }

  // Auto-trigger states for Figma capture via ?state= query param
  const params = new URLSearchParams(window.location.search);
  const autoState = params.get('state');
  if (autoState === 'chat' || autoState === 'report') {
    openChatFlow(0, { autoOpenReport: autoState === 'report' });
  } else if (autoState === 'library') {
    openLibraryView();
  } else if (autoState === 'designer') {
    openChatFlow(0, { autoOpenReport: false });
  }

  // Also handle prompt input Enter key
  const promptInput = document.querySelector('.prompt-input-row input');
  const sendBtn = document.querySelector('.prompt-input-row forge-icon-button');
  if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && promptInput.value.trim()) {
        openChatFlow(0); // Default to first suggestion for prototype
      }
    });
  }
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      if (promptInput && promptInput.value.trim()) {
        openChatFlow(0);
      }
    });
  }
});
