import React from 'react';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { bandService } from '../services/bandService';
import { message } from 'antd';

const { Title, Text } = Typography;

const CreateBand: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values: { name: string }) => {
    setLoading(true);
    try {
      await bandService.createBand({ name: values.name });
      message.success('Band created successfully!');
      navigate('/home/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to create band');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/home/dashboard');
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      width: '100vw',
      background: '#f0f2f5',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>Create Your Band</Title>
            <Text type="secondary">Set up your first band to get started</Text>
          </div>

          <Form
            name="create-band"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Please input your band name!' }]}
            >
              <Input 
                prefix={<TeamOutlined />} 
                placeholder="Band Name" 
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block
                loading={loading}
              >
                Create Band
              </Button>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button 
                type="text" 
                size="large" 
                block
                onClick={handleSkip}
              >
                Skip for now
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default CreateBand;