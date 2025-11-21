import React from 'react';
import { Typography, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Shows: React.FC = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Shows</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          New Show
        </Button>
      </div>
      
      <Text type="secondary">Your shows will appear here...</Text>
    </div>
  );
};

export default Shows;