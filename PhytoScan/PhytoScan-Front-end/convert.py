# convert_model.py

import torch
import torchvision.models as models
import torch.nn as nn

# Match your PlantDiseaseModel
class PlantDiseaseModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.network = models.resnet34(weights=models.ResNet34_Weights.IMAGENET1K_V1)
        num_ftrs = self.network.fc.in_features
        self.network.fc = nn.Linear(num_ftrs, 38)

    def forward(self, xb):
        return self.network(xb)

# Load your model
model = PlantDiseaseModel()
model.load_state_dict(torch.load("assets/model/plantDisease-resnet34.pt", map_location=torch.device('cpu')))
model.eval()

# Dummy input (matching input size: 1x3x224x224)
dummy_input = torch.randn(1, 3, 224, 224)

# Convert to TorchScript via tracing
traced_script_module = torch.jit.trace(model, dummy_input)

# Save TorchScript model
traced_script_module.save("assets/model/plantDisease-resnet34-scripted.pt")

print("✅ Model successfully converted to TorchScript and saved.")
