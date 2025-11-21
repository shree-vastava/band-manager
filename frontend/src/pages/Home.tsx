import React, { useState } from 'react';
import { Layout, Menu, Typography, Button, Space } from 'antd';
import { 
  DashboardOutlined, 
  UnorderedListOutlined, 
  CalendarOutlined,
  LogoutOutlined 
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/home/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/home/setlists',
      icon: <UnorderedListOutlined />,
      label: 'Setlists',
    },
    {
      key: '/home/shows',
      icon: <CalendarOutlined />,
      label: 'Shows',
    },
  ];

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{ background: '#001529' }}
        width={250}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold'
        }}>
          {collapsed ? 'BM' : 'Band Management'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 48px', 
          display: 'flex', 
          flexDirection: 'row',
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: 64
        }}>
          <Text strong style={{ fontSize: 18 }}>Welcome, {user?.name}!</Text>
          <Button 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            size="large"
            type="default"
          >
            Logout
          </Button>
        </Header>
        
        <Content style={{ 
          margin: '32px 48px', 
          background: '#fff', 
          padding: '48px', 
          minHeight: 280,
          borderRadius: 8
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home;