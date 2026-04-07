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
  defineExpansionPanelComponent,
  defineOpenIconComponent,
  defineBadgeComponent,
  defineTooltipComponent,
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
  tylIconFlag,
  tylIconWarning,
  tylIconUpdate,
  tylIconDescription,
  tylIconAccountBalance,
  tylIconMap,
  tylIconShield,
  tylIconPeople,
  tylIconChecklist,
  tylIconExpandMore,
  tylIconGavel,
  tylIconWater,
  tylIconSettings,
  tylIconPalette,
  tylIconEngineering,
  tylIconAccountBalanceWallet,
  tylIconApps,
  tylIconDashboard,
  tylIconBookmark,
  tylIconTrendingUp,
  tylIconAssignment,
  tylIconBusiness,
  tylIconShuffle,
  tylIconEdit,
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
defineExpansionPanelComponent();
defineOpenIconComponent();
defineBadgeComponent();
defineTooltipComponent();

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
  tylIconFlag,
  tylIconWarning,
  tylIconUpdate,
  tylIconDescription,
  tylIconAccountBalance,
  tylIconMap,
  tylIconShield,
  tylIconPeople,
  tylIconChecklist,
  tylIconExpandMore,
  tylIconGavel,
  tylIconWater,
  tylIconSettings,
  tylIconPalette,
  tylIconEngineering,
  tylIconAccountBalanceWallet,
  tylIconApps,
  tylIconDashboard,
  tylIconBookmark,
  tylIconTrendingUp,
  tylIconAssignment,
  tylIconBusiness,
  tylIconShuffle,
  tylIconEdit,
]);

// Forge AI components (Lit-based, self-register on import)
import '@tylertech/forge-ai/ai-prompt';
import '@tylertech/forge-ai/ai-suggestions';
import '@tylertech/forge-ai/ai-chat-interface';
import '@tylertech/forge-ai/ai-user-message';
import '@tylertech/forge-ai/ai-response-message';
import '@tylertech/forge-ai/ai-thinking-indicator';
import '@tylertech/forge-ai/ai-chatbot';

// Router
import { registerView, startRouter } from './router.js';

// Views
import * as tiraView from './views/tira-view.js';

// Chat flow (for ?state= auto-triggers)
import { openChatFlow } from './chat-flow.js';

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Register views
  registerView('tira', tiraView);

  // Start router (defaults to 'tira')
  startRouter('tira');

  // Auto-trigger states for Figma capture via ?state= query param
  const params = new URLSearchParams(window.location.search);
  const autoState = params.get('state');
  if (autoState === 'chat' || autoState === 'report') {
    openChatFlow(0, { autoOpenReport: autoState === 'report' });
  }
});

