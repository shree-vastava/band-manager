import React from 'react';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import { DollarOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '24px',
        marginTop: 32 
      }}>
        <Card hoverable style={{ minWidth: 300 }}>
          <Statistic
            title="Total Shows"
            value={0}
            prefix={<CalendarOutlined />}
            valueStyle={{ fontSize: 32 }}
          />
        </Card>
        
        <Card hoverable style={{ minWidth: 300 }}>
          <Statistic
            title="Total Income"
            value={0}
            prefix={<DollarOutlined />}
            suffix="₹"
            valueStyle={{ fontSize: 32 }}
          />
        </Card>
        
        <Card hoverable style={{ minWidth: 300 }}>
          <Statistic
            title="Band Fund"
            value={0}
            prefix={<DollarOutlined />}
            suffix="₹"
            valueStyle={{ fontSize: 32 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;