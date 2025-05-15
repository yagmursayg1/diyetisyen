import React, { useState } from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const onFinish = ({ email, password }) => {
    setLoading(true);
    setErrorMsg('');

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userByEmail = users.find(u => u.email === email);

    if (!userByEmail || userByEmail.password !== password) {
      setErrorMsg('E-posta veya şifre hatalı!');
      setTimeout(() => setErrorMsg(''), 3000); // 3 saniyede kaybolur
      setLoading(false);
      return;
    }

    setErrorMsg('');
    setLoading(false);
    localStorage.setItem('loggedInUser', JSON.stringify(userByEmail));
    navigate('/home');
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundImage: 'url("/bg.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Overlay: siyah yarı saydam tabaka */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // %40 karartma
        zIndex: 1,
      }} />

      {/* Hata mesajı üstte */}
      {errorMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff4d4f',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontWeight: 'bold',
        }}>
          {errorMsg}
        </div>
      )}

      {/* Form kutusu */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: '400px',
        zIndex: 2, // overlay'in üstünde
      }}>
        <Title level={2} style={{ textAlign: 'center' }}>
          Giriş Yap
        </Title>

        <Form name="login_form" layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="E-posta"
            name="email"
            rules={[{ required: true, message: 'Lütfen e-posta giriniz!' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="E-posta adresiniz" />
          </Form.Item>

          <Form.Item
            label="Şifre"
            name="password"
            rules={[{ required: true, message: 'Lütfen şifrenizi giriniz!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Şifreniz" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Giriş Yap
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'right' }}>
          <Link to="/register">Kayıt Ol</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
