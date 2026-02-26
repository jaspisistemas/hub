export interface HeroSectionDto {
  title: string;
  subtitle: string;
  cta: string;
  imageUrl?: string;
}

export interface ProblemDto {
  icon?: string;
  description: string;
}

export interface SolutionDto {
  icon?: string;
  title: string;
  description: string;
}

export interface BenefitDto {
  icon?: string;
  title: string;
  description: string;
}

export interface HowItWorksStepDto {
  step: number;
  title: string;
  description: string;
  icon?: string;
}

export interface SocialProofDto {
  metric: string;
  value: string | number;
}

export interface CtaDto {
  title: string;
  subtitle: string;
  buttonText: string;
}

export interface InfoPageDto {
  hero: HeroSectionDto;
  problems: ProblemDto[];
  solutions: SolutionDto[];
  benefits: BenefitDto[];
  targetAudience: string;
  howItWorks: HowItWorksStepDto[];
  socialProof: SocialProofDto[];
  cta: CtaDto;
}
