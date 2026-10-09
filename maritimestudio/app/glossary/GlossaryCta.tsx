import { Cta } from '@/components/Cta';
import { Icon } from '@/components/Icon';

export function GlossaryCta() {
  return (
    <Cta
      id="gloss-cta"
      title="Put these terms into practice"
      lead="Maritime.Studio delivers online training for maritime officers and DPOs, plus specialist consulting in dynamic positioning and FMEA. If a definition raised a question about your vessel or your crew's competence, we can help."
    >
      <a className="btn btn--sand" href="/services/">Explore our services <Icon name="arrow" /></a>
    </Cta>
  );
}
