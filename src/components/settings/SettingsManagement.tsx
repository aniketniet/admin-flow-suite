import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import Cookies from "js-cookie";

export function SettingsManagement() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    vendorCommission: 15,
    plateformfee: 5,
    gst: 5,
    deliveryFee: 40,
  });
  const [loading, setLoading] = useState(false);

  const token = Cookies.get("admin_token");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [id]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_UR}admin/set-settings`,
        settings,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast({
        title: "Success",
        description: "Settings saved successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          {/* <TabsTrigger value="payment">Payment</TabsTrigger> */}
          {/* <TabsTrigger value="delivery">Delivery</TabsTrigger> */}
          {/* <TabsTrigger value="email">Email/SMS</TabsTrigger> */}
          {/* <TabsTrigger value="appearance">Appearance</TabsTrigger> */}
        </TabsList>

        {/* <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorCommission">
                    Vendor Commission (%)
                  </Label>
                  <Input
                    id="vendorCommission"
                    type="number"
                    value={settings.vendorCommission}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="plateformfee">Platform Fee (%)</Label>
                  <Input
                    id="plateformfee"
                    type="number"
                    value={settings.plateformfee}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="gst">GST (%)</Label>
                  <Input
                    id="gst"
                    type="number"
                    value={settings.gst}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryFee">Delivery Fee (₹)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    value={settings.deliveryFee}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save General Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent> */}


        

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Stripe</Label>
                  <p className="text-sm text-gray-500">
                    Accept credit card payments
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Razorpay</Label>
                  <p className="text-sm text-gray-500">
                    Accept payments in India
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Cash on Delivery</Label>
                  <p className="text-sm text-gray-500">Allow COD payments</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button>Save Payment Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="minOrder">Minimum Order Amount</Label>
                <Input id="minOrder" type="number" placeholder="0" />
              </div>
              <div>
                <Label htmlFor="freeDelivery">Free Delivery Above</Label>
                <Input id="freeDelivery" type="number" placeholder="50.00" />
              </div>
              <Button>Save Delivery Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email & SMS Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Order Confirmation Email</Label>
                  <p className="text-sm text-gray-500">
                    Send email when order is placed
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Shipping Updates SMS</Label>
                  <p className="text-sm text-gray-500">
                    Send SMS for shipping updates
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-gray-500">
                    Send promotional emails
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button>Save Email Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input id="primaryColor" type="color" defaultValue="#3b82f6" />
              </div>
              <div>
                <Label htmlFor="logo">Logo URL</Label>
                <Input id="logo" placeholder="https://example.com/logo.png" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-gray-500">Enable dark theme</p>
                </div>
                <Switch />
              </div>
              <Button>Save Appearance Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
