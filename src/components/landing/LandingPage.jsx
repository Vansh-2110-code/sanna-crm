import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Kanban,
  FileText,
  Headphones,
  Users,
  Building,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight,
  Play,
  Globe,
  Award,
  Star,
  Activity,
  Layers,
  Shield,
  Wallet,
  LogIn,
  ShoppingBag,
  Boxes
} from 'lucide-react';

const LandingPage = ({ onNavigateToAuth }) => {
  const { login } = useCRM();
  const canvasRef = useRef(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [activeFeatureTab, setActiveFeatureTab] = useState('pipeline');

  // 3D Canvas Interactive Particle Sphere & Grid Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId;

    const getDimensions = () => {
      const w = canvas.parentElement?.offsetWidth || window.innerWidth || 1200;
      const h = canvas.parentElement?.offsetHeight || window.innerHeight || 800;
      return { w, h };
    };

    let { w: width, h: height } = getDimensions();
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      if (!canvas) return;
      const dims = getDimensions();
      width = canvas.width = dims.w;
      height = canvas.height = dims.h;
    };
    window.addEventListener('resize', handleResize);

    // 3D Particles & Nodes
    const particleCount = 70;
    const particles = [];
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 800 + 100,
        radius: Math.random() * 2 + 1,
        color: i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#a855f7' : '#38bdf8',
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: Math.random() * 0.5 + 0.2
      });
    }

    let angleX = 0;
    let angleY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      angleY = (mouse.x - width / 2) * 0.0003;
      angleX = (mouse.y - height / 2) * 0.0003;

      const fov = 400;
      const centerX = width / 2;
      const centerY = height / 2;

      // Draw background ambient 3D glowing radial gradient
      const gradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        50,
        centerX,
        centerY,
        width * 0.7
      );
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.18)');
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.08)');
      gradient.addColorStop(1, 'rgba(11, 15, 25, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Project & draw 3D particle sphere
      const projected = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 3D Rotation Math
        let cosY = Math.cos(angleY);
        let sinY = Math.sin(angleY);
        let cosX = Math.cos(angleX);
        let sinX = Math.sin(angleX);

        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        let y1 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        p.z -= p.vz;
        if (p.z < 100) p.z = 900;

        const scale = fov / (fov + z2);
        const projX = x1 * scale + centerX;
        const projY = y1 * scale + centerY;
        const projR = p.radius * scale * 1.5;

        projected.push({ x: projX, y: projY, scale, color: p.color });

        if (projX > 0 && projX < width && projY > 0 && projY < height) {
          ctx.beginPath();
          ctx.arc(projX, projY, Math.max(0.5, projR), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, Math.max(0.1, scale * 0.8));
          ctx.fill();
        }
      }

      // Connect 3D node lines between nearby particles
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 0.6;

      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#0b0f19',
      color: '#fff',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      
      {/* 3D Canvas Background Container */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* TOP NAVIGATION HEADER */}
      <header className="landing-nav" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '76px',
        background: 'rgba(11, 15, 25, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        zIndex: 100
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#ffffff',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255, 255, 255, 0.25)',
            flexShrink: 0
          }}>
            <img
              src="/logo.png"
              alt="Sanna CRM Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>
          <div>
            <span style={{ fontSize: '1.35rem', fontWeight: '900', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #fff 0%, #c7d2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SANNA CRM
            </span>
            <span style={{ fontSize: '0.65rem', color: '#a5b4fc', fontWeight: '800', display: 'block', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Enterprise Suite
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#features" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
          <a href="#architecture" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}>Zero-Trust Security</a>
          <a href="#pricing" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}>Pricing & Plans</a>
          <a href="#portal" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}>Customer Portal</a>
        </nav>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onNavigateToAuth}
            className="btn gradient-btn-primary landing-nav-cta-primary"
            style={{
              padding: '10px 22px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '700',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)'
            }}
          >
            <span>Sign In to Portal</span>
            <ArrowRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="landing-hero" style={{
        position: 'relative',
        zIndex: 10,
        paddingTop: '160px',
        paddingBottom: '100px',
        paddingLeft: '48px',
        paddingRight: '48px',
        maxWidth: '1280px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Micro Security Badge */}
        <div className="landing-hero-badge" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '30px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a5b4fc',
          fontSize: '0.8rem',
          fontWeight: '700',
          marginBottom: '28px',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)'
        }}>
          <ShieldCheck style={{ width: '16px', height: '16px', color: '#818cf8' }} />
          <span>SOC2 TYPE II & HIPAA COMPLIANT • ZERO-TRUST MULTI-TENANT ARCHITECTURE</span>
        </div>

        {/* Main Headline */}
        <h1 className="landing-hero-title" style={{
          fontSize: '4.2rem',
          fontWeight: '900',
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 70%, #c084fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Accelerate Sales Operations & Automate Customer Lifecycles
        </h1>

        <p className="landing-hero-subtitle" style={{
          fontSize: '1.25rem',
          color: '#94a3b8',
          maxWidth: '820px',
          margin: '0 auto 40px auto',
          lineHeight: 1.6
        }}>
          The enterprise multi-tenant CRM designed for B2B product sales teams. Featuring drag-and-drop pipeline forecasting, multi-currency quotation engines, dynamic RBAC matrices, and a self-service customer portal.
        </p>

        {/* Action Buttons */}
        <div className="landing-hero-buttons" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '60px' }}>
          <button
            onClick={onNavigateToAuth}
            className="btn gradient-btn-primary"
            style={{
              padding: '16px 36px',
              borderRadius: '16px',
              fontSize: '1.05rem',
              fontWeight: '800',
              boxShadow: '0 12px 35px rgba(99, 102, 241, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span>Sign In to Platform</span>
            <ArrowRight style={{ width: '20px', height: '20px' }} />
          </button>

          <a
            href="#features"
            className="btn btn-secondary"
            style={{
              padding: '16px 32px',
              borderRadius: '16px',
              fontSize: '1.05rem',
              fontWeight: '700',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: '#fff'
            }}
          >
            <Boxes style={{ width: '20px', height: '20px', color: '#38bdf8' }} />
            <span>Explore Modules</span>
          </a>
        </div>

        {/* 3D FLOATING GLASSMORTIC DASHBOARD MOCKUP SHOWCASE */}
        <div style={{
          perspective: '1200px',
          position: 'relative',
          marginTop: '20px'
        }}>
          <div style={{
            transform: 'rotateX(8deg) scale(0.96)',
            transition: 'all 0.5s ease',
            borderRadius: '24px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.9), 0 0 50px rgba(99, 102, 241, 0.25)',
            backdropFilter: 'blur(20px)'
          }}>
            {/* Live Interactive Feature Switcher Bar */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveFeatureTab('pipeline')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: activeFeatureTab === 'pipeline' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                  background: activeFeatureTab === 'pipeline' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(0,0,0,0.3)',
                  color: activeFeatureTab === 'pipeline' ? '#818cf8' : '#94a3b8',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Kanban style={{ width: '16px', height: '16px' }} />
                <span>Sales Pipeline Kanban</span>
              </button>

              <button
                onClick={() => setActiveFeatureTab('quotes')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: activeFeatureTab === 'quotes' ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                  background: activeFeatureTab === 'quotes' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(0,0,0,0.3)',
                  color: activeFeatureTab === 'quotes' ? '#c084fc' : '#94a3b8',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FileText style={{ width: '16px', height: '16px' }} />
                <span>Quotation & Invoice Builder</span>
              </button>

              <button
                onClick={() => setActiveFeatureTab('portal')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: activeFeatureTab === 'portal' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                  background: activeFeatureTab === 'portal' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0,0,0,0.3)',
                  color: activeFeatureTab === 'portal' ? '#34d399' : '#94a3b8',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Headphones style={{ width: '16px', height: '16px' }} />
                <span>Customer Self-Service Portal</span>
              </button>
            </div>

            {/* Simulated Live Preview Screen */}
            <div style={{
              background: '#0f172a',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'left',
              border: '1px solid rgba(255,255,255,0.1)',
              minHeight: '340px'
            }}>
              {activeFeatureTab === 'pipeline' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Enterprise Sales Pipeline Kanban</h3>
                    <span className="badge badge-purple">Weighted Forecast: $695,000</span>
                  </div>
                  <div className="mockup-kanban-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#60a5fa', marginBottom: '10px' }}>QUALIFIED (75% Win)</div>
                      <div className="glass-card" style={{ padding: '12px', marginBottom: '10px', background: 'var(--bg-secondary)' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>BioGenetics Cloud Overhaul</div>
                        <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700', marginTop: '4px' }}>$280,000</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#c084fc', marginBottom: '10px' }}>PROPOSAL SENT (85% Win)</div>
                      <div className="glass-card" style={{ padding: '12px', marginBottom: '10px', background: 'var(--bg-secondary)' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>OmniTech Bulk Hardware</div>
                        <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700', marginTop: '4px' }}>$180,000</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#34d399', marginBottom: '10px' }}>CLOSED WON (100%)</div>
                      <div className="glass-card" style={{ padding: '12px', marginBottom: '10px', background: 'var(--bg-secondary)' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Heavy Machinery Telemetry</div>
                        <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700', marginTop: '4px' }}>$220,000</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeatureTab === 'quotes' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Quotation & Invoice Builder</h3>
                    <span className="badge badge-emerald">PDF Generator Ready</span>
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '800' }}>QT-2026-880 • Acme Corporation</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sanna CRM Enterprise License x 2 Seats</div>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399' }}>$49,137</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Automatic GST/VAT taxes computed • Discount tier: 8% • Extended 24-month warranty terms.
                    </div>
                  </div>
                </div>
              )}

              {activeFeatureTab === 'portal' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Customer Portal Support Queue</h3>
                    <span className="badge badge-blue">SLA Guarantee: 2hr Resolution</span>
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-purple">TCK-9401</span>
                      <span className="badge badge-amber">Open Ticket</span>
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Database Sync Latency Timeout</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Submitted by Dr. Aris Thorne (BioGenetics) • Assigned SLA Engineer: Marcus Vance
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ENTERPRISE CORE FEATURES SUITE SECTION */}
      <section id="features" className="landing-section" style={{
        position: 'relative',
        zIndex: 10,
        padding: '100px 48px 60px 48px',
        maxWidth: '1280px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '30px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a5b4fc',
          fontSize: '0.8rem',
          fontWeight: '700',
          marginBottom: '20px'
        }}>
          <Zap style={{ width: '16px', height: '16px', color: '#818cf8' }} />
          <span>FULL LIFECYCLE SALES & OPERATIONS ENGINE</span>
        </div>

        <h2 style={{
          fontSize: '3rem',
          fontWeight: '900',
          letterSpacing: '-0.03em',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Comprehensive Enterprise Feature Suite
        </h2>

        <p style={{
          fontSize: '1.15rem',
          color: '#94a3b8',
          maxWidth: '780px',
          margin: '0 auto 56px auto',
          lineHeight: 1.6
        }}>
          Everything your revenue and operational teams need—from AI lead scoring and multi-currency quotes to order fulfillment, HR payroll telemetry, and zero-trust security.
        </p>

        {/* Feature Cards Grid (2x3 Layout) */}
        <div className="landing-features-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '28px',
          textAlign: 'left'
        }}>
          
          {/* Feature 1: Omnichannel Lead Acquisition & AI Scoring */}
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', borderLeft: '4px solid #6366f1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '14px' }}>
                <Users style={{ color: '#818cf8', width: '24px', height: '24px' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                LEAD SCORING ENGINE
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px' }}>Omnichannel Lead Acquisition & AI Scoring</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Capture leads from Website forms, Email campaigns, Referrals & Social ads. Compute real-time score values with automated duplicate domain matching warnings.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Score Math: Base(50) + Value Boost + Source Trust</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>DUP MATCH Banners for identical business emails</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>AI Sales Assistant lead qualification summary</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Sales Pipeline Kanban & Revenue Forecasting */}
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', borderLeft: '4px solid #a855f7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '12px', borderRadius: '14px' }}>
                <Kanban style={{ color: '#c084fc', width: '24px', height: '24px' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                PIPELINE KANBAN
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px' }}>Multi-Pipeline Kanban & Forecasting</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Drag-and-drop opportunity management with weighted revenue math: deal value by probability, stage progression metrics, and win forecasting.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#e9d5ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Real-time weighted win forecasting totals</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#e9d5ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Drag-and-drop stage updates with instant recalculations</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#e9d5ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Pipeline stage velocity tracking & deal analytics</span>
              </div>
            </div>
          </div>

          {/* Feature 3: Quotation Engine & PDF Builder */}
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', borderLeft: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '14px' }}>
                <FileText style={{ color: '#38bdf8', width: '24px', height: '24px' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                QUOTATION & PDF ENGINE
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px' }}>Multi-Currency Quote & Tax Engine</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Line-item quotation builder computing exact Subtotals, Discount Amounts, VAT/GST taxes, and Grand Totals across USD, EUR, GBP, INR, and JPY currencies.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#bae6fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Automated tax & volume discount calculation math</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#bae6fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>1-Click clean PDF quotation generator</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#bae6fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Discount approval thresholds for Sales Managers</span>
              </div>
            </div>
          </div>

          {/* Feature 4: Order Fulfillment & Invoicing */}
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '14px' }}>
                <ShoppingBag style={{ color: '#34d399', width: '24px', height: '24px' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                FULFILLMENT & BILLING
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px' }}>Order Fulfillment & Invoice Engine</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Convert accepted quotes into active orders (`ORD-2026-xxx`) in one click. Generate formal invoices (`INV-2026-xxx`) and track warehouse fulfillment states.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Instant Quote-to-Order & Invoice conversion</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Warehouse shipping & payment tracking states</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Hardware inventory stock synchronization</span>
              </div>
            </div>
          </div>

          {/* Feature 5: HR Roster, Attendance & Payroll */}
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', borderLeft: '4px solid #ec4899' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '12px', borderRadius: '14px' }}>
                <Wallet style={{ color: '#f472b6', width: '24px', height: '24px' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                HR & PAYROLL SUITE
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px' }}>HR Management & Payroll Telemetry</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Corporate employee directory control, base salary & commission bonus calculations, batch attendance logging, and HR document compliance vault.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#fbcfe8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Base salary + performance bonus calculator</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fbcfe8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Daily batch employee attendance recorder</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fbcfe8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Digital Employee ID generation & role assignment</span>
              </div>
            </div>
          </div>

          {/* Feature 6: Integrations Hub & Marketing ROI */}
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '14px' }}>
                <Boxes style={{ color: '#fbbf24', width: '24px', height: '24px' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                INTEGRATIONS HUB
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px' }}>Integrations Hub & Marketing ROI</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Native API connectivity with WhatsApp Business API, Google Workspace sync, Razorpay & Stripe payment gateways, plus campaign telemetry metrics.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#fef08a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>WhatsApp Cloud API & Gmail bi-directional sync</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fef08a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Razorpay & Stripe instant payment gateways</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fef08a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span>Marketing campaign Open %, Click %, & ROI telemetry</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ZERO-TRUST SECURITY & AUDIT VAULT SECTION */}
      <section id="architecture" className="landing-section" style={{
        position: 'relative',
        zIndex: 10,
        padding: '80px 48px',
        maxWidth: '1280px',
        margin: '0 auto',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(99, 102, 241, 0.05) 50%, rgba(15, 23, 42, 0) 100%)',
        borderRadius: '32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Enterprise Zero-Trust Security Framework
          </span>
          <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.03em', marginTop: '6px' }}>
            Zero-Trust Security & Audit Vault
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '720px', margin: '12px auto 0 auto' }}>
            Bank-grade data isolation, encrypted payload transmission, and real-time security audit telemetry.
          </p>
        </div>

        {/* Security Cards Grid */}
        <div className="landing-security-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px' }}>
          
          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px', borderLeft: '4px solid #6366f1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '12px' }}>
                <Lock style={{ color: '#818cf8', width: '24px', height: '24px' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Strict Tenant Context Lockdown</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              JWT claims are strictly decrypted on every incoming HTTP request. Tenant isolation parameters (<code style={{ color: '#818cf8' }}>decoded.tenantId</code>) cannot be overridden by frontend headers, guaranteeing 100% data boundary integrity between organizations.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '12px' }}>
                <ShieldCheck style={{ color: '#34d399', width: '24px', height: '24px' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Full Security Audit Trail</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Every sensitive change — such as creating orders, updating quotation currencies, or changing employee salary assignments — creates an immutable telemetry record tracked in the Security Vault.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '12px' }}>
                <Activity style={{ color: '#fbbf24', width: '24px', height: '24px' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Live Dynamic RBAC Matrix</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              System access rights for Admin, Sales Manager, Executive, HR, Support, and Customer roles update instantly in real time across the active user session without requiring page refreshes.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px', borderLeft: '4px solid #ec4899' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '12px', borderRadius: '12px' }}>
                <Layers style={{ color: '#f472b6', width: '24px', height: '24px' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Unified Architecture</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              End-to-end integration across sales pipelines, deliverables matrices, performance reviews, salary registers, GST invoicing, and financial ledger balances in a singular synchronized data store.
            </p>
          </div>

        </div>
      </section>

      {/* CUSTOMER PORTAL SHOWCASE SECTION */}
      <section id="portal" className="landing-section" style={{
        position: 'relative',
        zIndex: 10,
        padding: '80px 48px',
        maxWidth: '1280px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Client Self-Service Experience
          </span>
          <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.03em', marginTop: '6px' }}>
            Dedicated Customer Portal
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '720px', margin: '12px auto 0 auto' }}>
            Empower your B2B buyers with a branded portal to review quotes, track orders in real-time, submit tickets, and download compliance documents.
          </p>
        </div>

        {/* Interactive Customer Login Callout Banner */}
        <div className="glass-panel landing-banner-flex" style={{
          padding: '36px',
          borderRadius: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(56, 189, 248, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '800', textTransform: 'uppercase' }}>CLIENT PORTAL ACCESS</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '4px 0 6px 0' }}>Log In to Customer Portal</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Access order fulfillment, quotations, tickets, and financial documentation.
            </p>
          </div>

          <button
            onClick={onNavigateToAuth}
            className="btn gradient-btn-primary"
            style={{ padding: '14px 28px', borderRadius: '14px', fontSize: '0.95rem', fontWeight: '800' }}
          >
            <span>Access Customer Portal</span>
            <ArrowRight style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </section>

      {/* PRICING MATRIX SECTION */}
      <section id="pricing" className="landing-section" style={{
        position: 'relative',
        zIndex: 10,
        padding: '80px 48px',
        maxWidth: '1280px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Transparent Enterprise SaaS Plans
        </span>
        <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.03em', marginTop: '6px', marginBottom: '16px' }}>
          Flexible Pricing for Every Scale
        </h2>

        {/* Pricing Billing Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '50px' }}>
          <span style={{ fontSize: '0.9rem', color: billingCycle === 'monthly' ? '#fff' : 'var(--text-muted)', fontWeight: '700' }}>Monthly Billing</span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            style={{
              width: '54px',
              height: '28px',
              borderRadius: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              position: 'relative',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#6366f1',
              transform: billingCycle === 'yearly' ? 'translateX(26px)' : 'translateX(0)',
              transition: 'transform 0.2s ease'
            }} />
          </button>
          <span style={{ fontSize: '0.9rem', color: billingCycle === 'yearly' ? '#fff' : 'var(--text-muted)', fontWeight: '700' }}>
            Annual Billing <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: '800', marginLeft: '4px' }}>(Save 20%)</span>
          </span>
        </div>

        {/* Pricing Tier Cards */}
        <div className="landing-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px', textAlign: 'left' }}>
          
          {/* Starter Plan */}
          <div className="glass-card" style={{ padding: '36px', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Starter</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', margin: '12px 0 6px 0' }}>
                ${billingCycle === 'monthly' ? '49' : '39'}
                <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '500' }}> / month</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '24px' }}>Essential CRM pipelines and lead capture for emerging sales units.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Up to 5 Team Seats</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Kanban Pipeline Management</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Standard Quotation Generator</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Standard Email Support</span>
                </div>
              </div>
            </div>

            <button onClick={onNavigateToAuth} className="btn btn-secondary" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '700' }}>
              Get Started with Starter
            </button>
          </div>

          {/* Professional Plan (Highlighted) */}
          <div className="glass-card" style={{
            padding: '36px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '2px solid #6366f1',
            boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#fff',
              padding: '4px 16px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Most Popular
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#818cf8', textTransform: 'uppercase' }}>Professional</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', margin: '12px 0 6px 0' }}>
                ${billingCycle === 'monthly' ? '129' : '99'}
                <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '500' }}> / month</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '24px' }}>Advanced multi-currency quotes, RBAC matrices, and reporting engines.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Up to 25 Team Seats</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Multi-Currency Multi-Tax Engine</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Interactive Reports Engine</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Customer Self-Service Portal</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Priority 24/7 Support</span>
                </div>
              </div>
            </div>

            <button onClick={onNavigateToAuth} className="btn gradient-btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '800' }}>
              Upgrade to Professional
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-card" style={{ padding: '36px', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#c084fc', textTransform: 'uppercase' }}>Enterprise</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', margin: '12px 0 6px 0' }}>
                ${billingCycle === 'monthly' ? '299' : '249'}
                <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '500' }}> / month</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '24px' }}>Unlimited seats, custom SLAs, audit vault exports, and dedicated solutions architect.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Unlimited Seats & Organizations</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Full Immutable Security Audit Vault</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Multi-Tenant DB Sharding</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Custom Webhook Integrations</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span>Dedicated Account Manager & SLA</span>
                </div>
              </div>
            </div>

            <button onClick={onNavigateToAuth} className="btn btn-secondary" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '700' }}>
              Contact Enterprise Sales
            </button>
          </div>

        </div>
      </section>

      {/* FINAL CONVERSION CALL TO ACTION */}
      <section className="landing-section" style={{
        position: 'relative',
        zIndex: 10,
        padding: '100px 48px',
        maxWidth: '1280px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          padding: '60px 40px',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)'
        }}>
          <h2 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Ready to Supercharge Your Enterprise Sales?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto 36px auto', lineHeight: 1.6 }}>
            Join forward-thinking enterprise teams managing pipelines, contracts, and customer lifecycles on Sanna CRM.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={onNavigateToAuth}
              className="btn gradient-btn-primary"
              style={{
                padding: '16px 36px',
                borderRadius: '16px',
                fontSize: '1rem',
                fontWeight: '800',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)'
              }}
            >
              <span>Launch Your Workspace</span>
              <ArrowRight style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '40px 48px',
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: '#ffffff',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src="/logo.png"
              alt="Sanna CRM Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>SANNA CRM Enterprise Platform</span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          © 2026 Sanna CRM SaaS Inc. All rights reserved. SOC2 Type II Certified.
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
