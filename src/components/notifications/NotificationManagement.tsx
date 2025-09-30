import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NotificationManagement = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('title', title);
      params.append('message', message);
      params.append('type', type);

      const response = await fetch('https://shopinger.co.in/api/admin/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1ODg2NjE0NywiZXhwIjoxNzc0NDE4MTQ3fQ.gQHjl9XT3OJqFVbKgvZhAGCd6q3Chywey55kbTXa5uc',
        },
        body: params.toString(),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification sent successfully!",
        });
        // Reset form
        setTitle('');
        setMessage('');
        setType('all');
      } else {
        toast({
          title: "Error",
          description: "Failed to send notification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sending notification.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Push Notification</CardTitle>
          <CardDescription>
            Send push notifications to users, vendors, or all
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Type
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Notification"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManagement;