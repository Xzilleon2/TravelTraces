import { GatedPage } from "../components/GatedPage";
import { LayerMapInterface } from "../components/maps/LayerMapInterface";

export default function MappingLayerPage() {
  return (
    <GatedPage featureName="The live mapping layer">
      <LayerMapInterface />
    </GatedPage>
  );
}
