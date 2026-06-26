export type PortalActions = {
  updateInvoice: (formData: FormData) => Promise<void>;
  updateBrief: (formData: FormData) => Promise<void>;
  uploadMaterial: (formData: FormData) => Promise<void>;
  toggleStyleLike: (formData: FormData) => Promise<void>;
  addStyleComment: (formData: FormData) => Promise<void>;
  addCustomInspiration: (formData: FormData) => Promise<void>;
  confirmCreativeDirection: (formData: FormData) => Promise<void>;
  confirmStyleSelection: (formData: FormData) => Promise<void>;
  createRevision: (formData: FormData) => Promise<void>;
  submitApprovalFeedback: (formData: FormData) => Promise<void>;
  approveProject: (formData: FormData) => Promise<void>;
  createMaintenance: (formData: FormData) => Promise<void>;
  clientConfirmFinalPayment: (formData: FormData) => Promise<void>;
  clientMarkPaymentPaid: (formData: FormData) => Promise<void>;
  completeMaterials: (formData: FormData) => Promise<void>;
  completeOnboarding: (formData: FormData) => Promise<void>;
  markPortalWelcomeSeen: (formData: FormData) => Promise<void>;
};

export type JourneyStep = {
  key: string;
  label: string;
  title: string;
  summary: string;
  accent: "coral" | "mint" | "lemon" | "indigo" | "gradient";
};
