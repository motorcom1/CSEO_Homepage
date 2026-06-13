/* ==========================================================================
   CSEO Integrated System - Premium Interactive Sidebar Javascript Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize Lucide Icons
    lucide.createIcons();

    // ==========================================================================
    // 1. Welcome Screen (Intro) Text Rotation
    // ==========================================================================
    const welcomeText = document.getElementById('welcome-text');
    const welcomeScreen = document.getElementById('welcome-screen');
    
    const greetings = [
        "안녕하세요!",     // Korean
        "환영합니다!",     // Korean Welcome
        "Hello!",         // English
        "Welcome!",        // English Welcome
        "Bienvenue!",      // French
        "Guten Tag!",      // German
        "Hola!",           // Spanish
        "Ciao!"            // Italian
    ];
    
    let greetingIndex = 0;
    let greetingInterval;
    
    function rotateGreeting() {
        if (!welcomeText) return;
        
        welcomeText.classList.remove('show');
        
        setTimeout(() => {
            greetingIndex = (greetingIndex + 1) % greetings.length;
            welcomeText.textContent = greetings[greetingIndex];
            welcomeText.classList.add('show');
        }, 350);
    }
    
    if (welcomeText) {
        welcomeText.classList.add('show');
        greetingInterval = setInterval(rotateGreeting, 1500);
    }
    
    if (welcomeScreen) {
        welcomeScreen.addEventListener('click', () => {
            clearInterval(greetingInterval);
            navigateTo('portal-screen');
        });
    }

    // ==========================================================================
    // 2. SPA Screen Navigation & Sidebar View Reset
    // ==========================================================================
    const screens = {
        'welcome-screen': document.getElementById('welcome-screen'),
        'portal-screen': document.getElementById('portal-screen'),
        'manage-screen': document.getElementById('manage-screen'),
        'energy-screen': document.getElementById('energy-screen'),
        'safety-screen': document.getElementById('safety-screen'),
        'ax-screen': document.getElementById('ax-screen')
    };

    function navigateTo(screenId) {
        // Remove active class from all screens
        Object.values(screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        // Add active class to target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Reset subviews and active sidebar buttons to default on entry
        if (screenId === 'manage-screen') {
            resetSidebarViews('manage-screen', 'manage-org', '조직 구성도');
            stopEnergySimulator();
            stopSafetySimulator();
            stopAxSimulator();
        } else if (screenId === 'energy-screen') {
            resetSidebarViews('energy-screen', 'energy-overview', '실시간 전력 분석');
            stopSafetySimulator();
            stopAxSimulator();
            startEnergySimulator();
            setTimeout(initEnergyChart, 200); /* Proactively initialize the integrated chart */
        } else if (screenId === 'safety-screen') {
            resetSidebarViews('safety-screen', 'safety-overview', '실시간 안전 모니터링');
            stopEnergySimulator();
            stopAxSimulator();
            startSafetySimulator();
            setTimeout(initSafetyChart, 200); /* Proactively initialize the integrated safety chart */
        } else if (screenId === 'ax-screen') {
            resetSidebarViews('ax-screen', 'ax-overview', '실시간 AI 가동 분석');
            stopEnergySimulator();
            stopSafetySimulator();
            startAxSimulator();
            setTimeout(initAxChart, 200);
        } else {
            stopEnergySimulator();
            stopSafetySimulator();
            stopAxSimulator();
        }
    }

    // Helper to reset a dashboard to its default first tab
    function resetSidebarViews(screenId, defaultViewId, breadcrumbText) {
        const screen = document.getElementById(screenId);
        if (!screen) return;
        
        // Set first sidebar button as active
        const buttons = screen.querySelectorAll('.sidebar-btn');
        buttons.forEach((btn, index) => {
            if (index === 0) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        // Set first sub-view as active
        const subviews = screen.querySelectorAll('.sub-view');
        subviews.forEach(view => {
            if (view.id === defaultViewId) view.classList.add('active');
            else view.classList.remove('active');
        });
        
        // Reset Breadcrumbs
        if (screenId === 'manage-screen') {
            document.getElementById('manage-breadcrumb-text').textContent = breadcrumbText;
        } else if (screenId === 'energy-screen') {
            document.getElementById('energy-breadcrumb-text').textContent = breadcrumbText;
        } else if (screenId === 'safety-screen') {
            document.getElementById('safety-breadcrumb-text').textContent = breadcrumbText;
        } else if (screenId === 'ax-screen') {
            document.getElementById('ax-breadcrumb-text').textContent = breadcrumbText;
        }
    }

    // Portal screen button actions
    document.getElementById('btn-go-manage')?.addEventListener('click', () => navigateTo('manage-screen'));
    document.getElementById('btn-go-safety')?.addEventListener('click', () => navigateTo('safety-screen'));
    document.getElementById('btn-go-energy')?.addEventListener('click', () => navigateTo('energy-screen'));
    document.getElementById('btn-go-ax')?.addEventListener('click', () => navigateTo('ax-screen'));
    
    // Sidebar return buttons via Logo Click
    document.getElementById('logo-btn-manage')?.addEventListener('click', () => navigateTo('portal-screen'));
    document.getElementById('logo-btn-energy')?.addEventListener('click', () => navigateTo('portal-screen'));
    document.getElementById('logo-btn-safety')?.addEventListener('click', () => navigateTo('portal-screen'));
    document.getElementById('logo-btn-ax')?.addEventListener('click', () => navigateTo('portal-screen'));

    // ==========================================================================
    // 3. Sidebar Menu Sub-view Toggle Engine (좌측 버튼 제어 & 브레드크럼 매핑)
    // ==========================================================================
    const sidebarButtons = document.querySelectorAll('.sidebar-btn');
    
    sidebarButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            if (!targetId) return;
            
            // Identify active dashboard screen (manage or energy)
            const parentScreen = button.closest('.screen');
            if (!parentScreen) return;
            
            // 1. Toggle Active Sidebar Button
            parentScreen.querySelectorAll('.sidebar-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // 2. Toggle Active Sub-View panel
            parentScreen.querySelectorAll('.sub-view').forEach(view => {
                view.classList.remove('active');
            });
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.add('active');
            }
            
            // 3. Update Breadcrumb Text dynamically
            const menuText = button.querySelector('span').textContent;
            if (parentScreen.id === 'manage-screen') {
                document.getElementById('manage-breadcrumb-text').textContent = menuText;
                
                // Lazy-load Manage Charts only when active
                if (targetId === 'manage-analytics') {
                    setTimeout(initManageChart, 100);
                }
            } else if (parentScreen.id === 'energy-screen') {
                document.getElementById('energy-breadcrumb-text').textContent = menuText;
                
                // Lazy-load Energy Charts only when active
                if (targetId === 'energy-overview') {
                    setTimeout(initEnergyChart, 100);
                } else if (targetId === 'energy-bill-analysis') {
                    setTimeout(initUtilityOutlookChart, 100);
                } else if (targetId === 'energy-weather-analysis') {
                    setTimeout(initWeatherChart, 100);
                    setTimeout(initDailyForecast, 100);
                }
            } else if (parentScreen.id === 'safety-screen') {
                document.getElementById('safety-breadcrumb-text').textContent = menuText;
                
                // Lazy-load Safety Charts only when active
                if (targetId === 'safety-overview') {
                    setTimeout(initSafetyChart, 100);
                }
            } else if (parentScreen.id === 'ax-screen') {
                document.getElementById('ax-breadcrumb-text').textContent = menuText;
                
                // Lazy-load AX Charts only when active
                if (targetId === 'ax-overview') {
                    setTimeout(initAxChart, 100);
                }
            }
        });
    });

    // ==========================================================================
    // 3.5 Utility rates tab toggle (전기 vs 용수)
    // ==========================================================================
    const btnTabElec = document.getElementById('btn-tab-elec');
    const btnTabWater = document.getElementById('btn-tab-water');
    const btnTabGas = document.getElementById('btn-tab-gas');
    const panelElec = document.getElementById('rates-content-elec');
    const panelWater = document.getElementById('rates-content-water');
    const panelGas = document.getElementById('rates-content-gas');

    btnTabElec?.addEventListener('click', () => {
        btnTabElec.classList.add('active');
        btnTabWater.classList.remove('active');
        btnTabGas?.classList.remove('active');
        btnTabElec.style.background = '#ffffff';
        btnTabWater.style.background = 'transparent';
        if (btnTabGas) btnTabGas.style.background = 'transparent';
        btnTabElec.style.color = 'var(--text-primary)';
        btnTabWater.style.color = 'var(--text-secondary)';
        if (btnTabGas) btnTabGas.style.color = 'var(--text-secondary)';
        if (panelElec) panelElec.style.display = 'block';
        if (panelWater) panelWater.style.display = 'none';
        if (panelGas) panelGas.style.display = 'none';
    });

    btnTabWater?.addEventListener('click', () => {
        btnTabWater.classList.add('active');
        btnTabElec.classList.remove('active');
        btnTabGas?.classList.remove('active');
        btnTabWater.style.background = '#ffffff';
        btnTabElec.style.background = 'transparent';
        if (btnTabGas) btnTabGas.style.background = 'transparent';
        btnTabWater.style.color = 'var(--text-primary)';
        btnTabElec.style.color = 'var(--text-secondary)';
        if (btnTabGas) btnTabGas.style.color = 'var(--text-secondary)';
        if (panelElec) panelElec.style.display = 'none';
        if (panelWater) panelWater.style.display = 'block';
        if (panelGas) panelGas.style.display = 'none';
    });

    btnTabGas?.addEventListener('click', () => {
        btnTabGas.classList.add('active');
        btnTabElec.classList.remove('active');
        btnTabWater.classList.remove('active');
        btnTabGas.style.background = '#ffffff';
        btnTabElec.style.background = 'transparent';
        btnTabWater.style.background = 'transparent';
        btnTabGas.style.color = 'var(--text-primary)';
        btnTabElec.style.color = 'var(--text-secondary)';
        btnTabWater.style.color = 'var(--text-secondary)';
        if (panelElec) panelElec.style.display = 'none';
        if (panelWater) panelWater.style.display = 'none';
        if (panelGas) panelGas.style.display = 'block';
    });

    // Gas Sub-tab Selector
    const btnGasSeoul = document.getElementById('btn-gas-seoul');
    const btnGasYeongnam = document.getElementById('btn-gas-yeongnam');
    const displaySeoul = document.getElementById('gas-display-seoul');
    const displayYeongnam = document.getElementById('gas-display-yeongnam');
    const tableSeoul = document.getElementById('gas-table-seoul');
    const tableYeongnam = document.getElementById('gas-table-yeongnam');

    btnGasSeoul?.addEventListener('click', () => {
        btnGasSeoul.classList.add('active');
        btnGasYeongnam?.classList.remove('active');
        btnGasSeoul.style.background = '#ffffff';
        btnGasSeoul.style.color = 'var(--primary-green)';
        if (btnGasYeongnam) {
            btnGasYeongnam.style.background = 'transparent';
            btnGasYeongnam.style.color = 'var(--text-secondary)';
        }
        if (displaySeoul) displaySeoul.style.display = 'flex';
        if (displayYeongnam) displayYeongnam.style.display = 'none';
        if (tableSeoul) tableSeoul.style.display = 'table';
        if (tableYeongnam) tableYeongnam.style.display = 'none';
    });

    btnGasYeongnam?.addEventListener('click', () => {
        btnGasYeongnam.classList.add('active');
        btnGasSeoul?.classList.remove('active');
        btnGasYeongnam.style.background = '#ffffff';
        btnGasYeongnam.style.color = 'var(--primary-green)';
        if (btnGasSeoul) {
            btnGasSeoul.style.background = 'transparent';
            btnGasSeoul.style.color = 'var(--text-secondary)';
        }
        if (displaySeoul) displaySeoul.style.display = 'none';
        if (displayYeongnam) displayYeongnam.style.display = 'flex';
        if (tableSeoul) tableSeoul.style.display = 'none';
        if (tableYeongnam) tableYeongnam.style.display = 'table';
    });

    // KEPCO Season Selection click listeners
    const btnSeasonSummer = document.getElementById('btn-season-summer');
    const btnSeasonWinter = document.getElementById('btn-season-winter');
    const btnSeasonSpringAutumn = document.getElementById('btn-season-springautumn');

    btnSeasonSummer?.addEventListener('click', () => {
        selectedKepcoSeason = 'summer';
        updateKepcoRatesUI();
    });
    btnSeasonWinter?.addEventListener('click', () => {
        selectedKepcoSeason = 'winter';
        updateKepcoRatesUI();
    });
    btnSeasonSpringAutumn?.addEventListener('click', () => {
        selectedKepcoSeason = 'spring_autumn';
        updateKepcoRatesUI();
    });

    // ==========================================================================
    // 4. Premium Cursor Spotlight Tracking Effect for Portal Cards
    // ==========================================================================
    const portalCards = document.querySelectorAll('.portal-card');
    
    portalCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.removeProperty('--x');
            card.style.removeProperty('--y');
        });
    });

    // ==========================================================================
    // 5. Interactive Organization Chart Logic (Manage Screen)
    // ==========================================================================
    const deptData = {
        'node-planning': {
            badge: '기획',
            title: '기획조정실 주요 R&R',
            leader: '이성우 실장 (경영학 석사)',
            mission: '중장기 전사 사업계획 수립, 글로벌 예산 배정, 사내 자본 재배치 및 ESG 경영 고도화 성과 전반 지휘 관리.',
            members: ['정서아 수석 (전략기획)', '윤지후 책임 (재무분석)', '송지선 선임 (브랜드홍보)', '한준우 선임 (대외협력)']
        },
        'node-rd': {
            badge: 'R&D',
            title: '연구개발본부 주요 R&R',
            leader: '최윤서 본부장 (공학박사)',
            mission: '인공지능 기반 데이터 수집/가공 머신러닝 엔진 설계, 친환경 분산 전원 시스템 계통 연계 핵심 인프라 H/W 및 S/W 플랫폼 연구개발.',
            members: ['이진아 수석 (에너지 AI)', '강도현 책임 (IoT 하드웨어)', '정서율 책임 (빅데이터 파이프라인)', '최유진 선임 (클라우드 플랫폼)', '박성민 선임 (모바일 앱)']
        },
        'node-ops': {
            badge: '운영',
            title: '운영지원부 주요 R&R',
            leader: '박지한 부장',
            mission: '사내 임직원 혁신 근무 환경 최적화 설계, 전사 인사 채용 및 인사 평가, 공공 행정 규제 준수 및 사옥 안전 시설 관리 감독.',
            members: ['김민재 책임 (인사관리)', '이지현 책임 (행정지원)', '서지우 선임 (인프라보안)', '조은우 선임 (총무행정)']
        },
        'node-databiz': {
            badge: '데이터본부',
            title: '데이터사업부 주요 R&R',
            leader: '한민석 부장',
            mission: '연구소에서 가공된 탄소 배출 및 친환경 발전 정제 데이터를 활용한 금융/에너지 도매 시장 유통 기획 및 B2B B2G 전략적 마케팅 세일즈.',
            members: ['김선우 책임 (비즈니스마케팅)', '임하은 책임 (에너지영업)', '신재희 선임 (솔루션엔지니어)', '김주원 선임 (상품기획)']
        }
    };

    const deptNodes = document.querySelectorAll('.dept-node');
    const detailBadge = document.getElementById('detail-dept-badge');
    const detailTitle = document.getElementById('detail-dept-title');
    const detailLeader = document.getElementById('detail-dept-leader');
    const detailMission = document.getElementById('detail-dept-mission');
    const detailMembers = document.getElementById('detail-dept-members');

    deptNodes.forEach(node => {
        node.addEventListener('click', () => {
            deptNodes.forEach(n => n.classList.remove('active'));
            node.classList.add('active');
            
            const data = deptData[node.id];
            if (!data) return;
            
            if (detailBadge) {
                detailBadge.textContent = data.badge;
                detailBadge.className = `detail-badge tag-${node.id.replace('node-', '')}`;
            }
            if (detailTitle) detailTitle.textContent = data.title;
            if (detailLeader) detailLeader.textContent = data.leader;
            if (detailMission) detailMission.textContent = data.mission;
            
            if (detailMembers) {
                detailMembers.innerHTML = '';
                data.members.forEach(member => {
                    const span = document.createElement('span');
                    span.className = 'member-pill';
                    span.textContent = member;
                    detailMembers.appendChild(span);
                });
            }
        });
    });

    // ==========================================================================
    // 6. Chart.js Graphs (Manage Analytics)
    // ==========================================================================
    let manageChartInstance = null;
    
    function initManageChart() {
        const ctx = document.getElementById('manage-analytics-chart');
        if (!ctx || manageChartInstance) return;
        
        const dataVolume = {
            labels: ['기획조정실', '연구개발본부', '운영지원부', '데이터사업부'],
            datasets: [
                {
                    label: '로컬 데이터 용량 (GB)',
                    data: [120, 780, 45, 520],
                    backgroundColor: 'rgba(99, 102, 241, 0.4)',
                    borderColor: '#6366f1',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                },
                {
                    label: '클라우드 연계 용량 (GB)',
                    data: [250, 1420, 110, 980],
                    backgroundColor: 'rgba(59, 130, 246, 0.4)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        };

        manageChartInstance = new Chart(ctx, {
            type: 'bar',
            data: dataVolume,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Outfit', size: 12, weight: '500' },
                            color: '#475569'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#475569',
                        borderColor: 'rgba(99, 102, 241, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        titleFont: { family: 'Noto Sans KR', weight: '700' },
                        bodyFont: { family: 'Outfit' }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Noto Sans KR', size: 12, weight: '500' },
                            color: '#475569'
                        }
                    },
                    y: {
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: {
                            font: { family: 'Outfit', size: 11 },
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    // ==========================================================================
    // 7. Chart.js Graphs (Energy Trends)
    // ==========================================================================
    let energyChartInstance = null;

    function initEnergyChart() {
        const ctx = document.getElementById('energy-trend-chart');
        if (!ctx || energyChartInstance) return;

        const hours = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '실시간'];
        
        const energyData = {
            labels: hours,
            datasets: [
                {
                    label: '친환경 자가 발전 (kW)',
                    data: [410, 435, 480, 495, 460, 425, 385, 467.3],
                    borderColor: '#10b981',
                    borderWidth: 3,
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: '사옥 실시간 부하 (kW)',
                    data: [390, 410, 435, 420, 445, 430, 405, 412.3],
                    borderColor: '#3b82f6',
                    borderWidth: 3,
                    backgroundColor: 'rgba(59, 130, 246, 0.04)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        };

        energyChartInstance = new Chart(ctx, {
            type: 'line',
            data: energyData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Outfit', size: 12, weight: '500' },
                            color: '#475569'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#475569',
                        borderColor: 'rgba(16, 185, 129, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        titleFont: { family: 'Outfit', weight: '700' },
                        bodyFont: { family: 'Outfit' }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Outfit', size: 12, weight: '500' },
                            color: '#475569'
                        }
                    },
                    y: {
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: {
                            font: { family: 'Outfit', size: 11 },
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    // ==========================================================================
    // 8. Live Energy Simulation Engine
    // ==========================================================================
    let energySimInterval = null;
    
    let liveSolar = 342.8;
    let liveWind = 124.5;
    let liveEss = 84.0;
    let liveLoad = 412.3;
    
    let co2Val = 24845;
    let treesVal = 3764;
    let savingsVal = 5760400;

    // Simulated Account Billing Prices
    let priceHvac = 1425000;
    let priceRd = 1850000;
    let priceData = 845400;
    let priceIndWater = 320000;
    let priceDomWater = 120000;
    let priceSeoulGas = 520000;
    let priceYeongnamGas = 680000;
    let selectedKepcoSeason = null;

    // Weather simulation state variables
    let livePajuTemp = 24.5;
    let livePajuHumi = 68;
    let liveGumiTemp = 25.8;
    let liveGumiHumi = 62;
    let liveGuangzhouTemp = 30.2;
    let liveGuangzhouHumi = 82;
    let liveHaiphongTemp = 29.5;
    let liveHaiphongHumi = 85;
    
    // Persistent random walk drifts to simulate natural fluctuations
    let pajuTempDrift = 0;
    let gumiTempDrift = 0;
    let guangzhouTempDrift = 0;
    let haiphongTempDrift = 0;
    let pajuHumiDrift = 0;
    let gumiHumiDrift = 0;
    let guangzhouHumiDrift = 0;
    let haiphongHumiDrift = 0;

    function startEnergySimulator() {
        if (energySimInterval) return;
        
        energySimInterval = setInterval(() => {
            // Fluctuate weather parameters
            const timeVal = (new Date().getHours() + new Date().getMinutes() / 60 + new Date().getSeconds() / 3600);
            const sineTemp = Math.sin((timeVal - 8) * Math.PI / 12);
            const sineHumi = -sineTemp;
            
            pajuTempDrift += (Math.random() - 0.5) * 0.15;
            if (pajuTempDrift < -0.8) pajuTempDrift = -0.8;
            if (pajuTempDrift > 0.8) pajuTempDrift = 0.8;
            
            gumiTempDrift += (Math.random() - 0.5) * 0.15;
            if (gumiTempDrift < -0.8) gumiTempDrift = -0.8;
            if (gumiTempDrift > 0.8) gumiTempDrift = 0.8;

            guangzhouTempDrift += (Math.random() - 0.5) * 0.15;
            if (guangzhouTempDrift < -0.8) guangzhouTempDrift = -0.8;
            if (guangzhouTempDrift > 0.8) guangzhouTempDrift = 0.8;

            haiphongTempDrift += (Math.random() - 0.5) * 0.15;
            if (haiphongTempDrift < -0.8) haiphongTempDrift = -0.8;
            if (haiphongTempDrift > 0.8) haiphongTempDrift = 0.8;
            
            pajuHumiDrift += (Math.random() - 0.5) * 0.4;
            if (pajuHumiDrift < -2.0) pajuHumiDrift = -2.0;
            if (pajuHumiDrift > 2.0) pajuHumiDrift = 2.0;
            
            gumiHumiDrift += (Math.random() - 0.5) * 0.4;
            if (gumiHumiDrift < -2.0) gumiHumiDrift = -2.0;
            if (gumiHumiDrift > 2.0) gumiHumiDrift = 2.0;

            guangzhouHumiDrift += (Math.random() - 0.5) * 0.4;
            if (guangzhouHumiDrift < -2.0) guangzhouHumiDrift = -2.0;
            if (guangzhouHumiDrift > 2.0) guangzhouHumiDrift = 2.0;

            haiphongHumiDrift += (Math.random() - 0.5) * 0.4;
            if (haiphongHumiDrift < -2.0) haiphongHumiDrift = -2.0;
            if (haiphongHumiDrift > 2.0) haiphongHumiDrift = 2.0;
            
            // Summer base profiles: Paju 18.0~28.0 (midpoint 23.0, amp 5.0), Gumi 19.5~29.5 (midpoint 24.5, amp 5.0), Guangzhou 26.0~34.0 (midpoint 30.0, amp 4.0), Haiphong 26.0~33.0 (midpoint 29.5, amp 3.5)
            livePajuTemp = 23.0 + 5.0 * sineTemp + pajuTempDrift;
            livePajuHumi = 72.5 + 12.5 * sineHumi + pajuHumiDrift;
            
            liveGumiTemp = 24.5 + 5.0 * sineTemp + gumiTempDrift;
            liveGumiHumi = 67.5 + 12.5 * sineHumi + gumiHumiDrift;

            liveGuangzhouTemp = 30.0 + 4.0 * sineTemp + guangzhouTempDrift;
            liveGuangzhouHumi = 80.0 + 10.0 * sineHumi + guangzhouHumiDrift;

            liveHaiphongTemp = 29.5 + 3.5 * sineTemp + haiphongTempDrift;
            liveHaiphongHumi = 85.0 + 10.0 * sineHumi + haiphongHumiDrift;
            
            // Constrain humidity within realistic range
            if (livePajuHumi < 0) livePajuHumi = 0;
            if (livePajuHumi > 100) livePajuHumi = 100;
            if (liveGumiHumi < 0) liveGumiHumi = 0;
            if (liveGumiHumi > 100) liveGumiHumi = 100;
            if (liveGuangzhouHumi < 0) liveGuangzhouHumi = 0;
            if (liveGuangzhouHumi > 100) liveGuangzhouHumi = 100;
            if (liveHaiphongHumi < 0) liveHaiphongHumi = 0;
            if (liveHaiphongHumi > 100) liveHaiphongHumi = 100;
            // Fluctuate Solar: 320 to 365 kW
            liveSolar += (Math.random() - 0.5) * 8;
            if (liveSolar < 310) liveSolar = 310;
            if (liveSolar > 370) liveSolar = 370;
            
            // Fluctuate Wind: 100 to 150 kW
            liveWind += (Math.random() - 0.5) * 6;
            if (liveWind < 100) liveWind = 100;
            if (liveWind > 150) liveWind = 150;
            
            // Fluctuate Building load: 380 to 440 kW
            liveLoad += (Math.random() - 0.5) * 10;
            if (liveLoad < 380) liveLoad = 380;
            if (liveLoad > 440) liveLoad = 440;
            
            // ESS charging/discharging
            const generationTotal = liveSolar + liveWind;
            if (generationTotal > liveLoad) {
                liveEss += 0.05;
            } else {
                liveEss -= 0.02;
            }
            if (liveEss > 100) liveEss = 100;
            if (liveEss < 10) liveEss = 10;

            // Increment ECO Metrics
            co2Val += Math.random() * 0.15;
            treesVal = Math.floor(co2Val * 0.151);
            
            // Fluctuate/Increment billing prices
            priceHvac += Math.floor(Math.random() * 10);
            priceRd += Math.floor(Math.random() * 12);
            priceData += Math.floor(Math.random() * 8);
            priceIndWater += Math.floor(Math.random() * 5);
            priceDomWater += Math.floor(Math.random() * 3);
            priceSeoulGas += Math.floor(Math.random() * 4);
            priceYeongnamGas += Math.floor(Math.random() * 5);
            savingsVal = priceHvac + priceRd + priceData + priceIndWater + priceDomWater + priceSeoulGas + priceYeongnamGas;

            // Update UI
            updateEnergyUI();
            
            // Update Live Chart point
            if (energyChartInstance) {
                const datasets = energyChartInstance.data.datasets;
                datasets[0].data[datasets[0].data.length - 1] = parseFloat(generationTotal.toFixed(1));
                datasets[1].data[datasets[1].data.length - 1] = parseFloat(liveLoad.toFixed(1));
                energyChartInstance.update('none');
            }

        }, 3000);
    }

    function stopEnergySimulator() {
        if (energySimInterval) {
            clearInterval(energySimInterval);
            energySimInterval = null;
        }
    }

    function updateEnergyUI() {
        const txtSolar = document.getElementById('live-solar-val');
        const barSolar = document.getElementById('live-solar-bar');
        const txtWind = document.getElementById('live-wind-val');
        const barWind = document.getElementById('live-wind-bar');
        const txtEss = document.getElementById('live-ess-val');
        const barEss = document.getElementById('live-ess-bar');
        const txtLoad = document.getElementById('live-load-val');
        const barLoad = document.getElementById('live-load-bar');
        
        const txtCo2 = document.getElementById('eco-co2-val');
        const txtTrees = document.getElementById('eco-trees-val');
        const txtSavings = document.getElementById('eco-savings-val');
        
        // Dynamic Billing UI Elements
        const txtSavingsBilling = document.getElementById('eco-savings-val-billing');
        const txtPriceHvac = document.getElementById('bill-price-hvac');
        const txtPriceRd = document.getElementById('bill-price-rd');
        const txtPriceData = document.getElementById('bill-price-data');
        const txtPriceIndWater = document.getElementById('bill-price-indwater');
        const txtPriceDomWater = document.getElementById('bill-price-domwater');
        const txtPriceSeoulGas = document.getElementById('bill-price-seoulgas');
        const txtPriceYeongnamGas = document.getElementById('bill-price-yngas');

        if (txtSolar) txtSolar.textContent = liveSolar.toFixed(1);
        if (barSolar) barSolar.style.width = `${((liveSolar - 200) / 200) * 100}%`;
        
        if (txtWind) txtWind.textContent = liveWind.toFixed(1);
        if (barWind) barWind.style.width = `${((liveWind - 80) / 100) * 100}%`;
        
        if (txtEss) txtEss.textContent = liveEss.toFixed(1);
        if (barEss) barEss.style.width = `${liveEss}%`;
        
        if (txtLoad) txtLoad.textContent = liveLoad.toFixed(1);
        if (barLoad) barLoad.style.width = `${((liveLoad - 300) / 200) * 100}%`;

        // Eco values
        if (txtCo2) txtCo2.textContent = Math.floor(co2Val).toLocaleString();
        if (txtTrees) txtTrees.textContent = treesVal.toLocaleString();
        if (txtSavings) txtSavings.textContent = savingsVal.toLocaleString();
        
        // Billing values
        if (txtSavingsBilling) txtSavingsBilling.textContent = savingsVal.toLocaleString();
        if (txtPriceHvac) txtPriceHvac.textContent = priceHvac.toLocaleString();
        if (txtPriceRd) txtPriceRd.textContent = priceRd.toLocaleString();
        if (txtPriceData) txtPriceData.textContent = priceData.toLocaleString();
        if (txtPriceIndWater) txtPriceIndWater.textContent = priceIndWater.toLocaleString();
        if (txtPriceDomWater) txtPriceDomWater.textContent = priceDomWater.toLocaleString();
        if (txtPriceSeoulGas) txtPriceSeoulGas.textContent = priceSeoulGas.toLocaleString();
        if (txtPriceYeongnamGas) txtPriceYeongnamGas.textContent = priceYeongnamGas.toLocaleString();

        // Dynamic budget calculation
        const elEstimatePct = document.getElementById('bill-estimate-pct');
        const elEstimateBar = document.getElementById('bill-estimate-bar');
        const budget = 8000000;
        const pct = (savingsVal / budget) * 100;
        if (elEstimatePct) elEstimatePct.textContent = `${pct.toFixed(1)}%`;
        if (elEstimateBar) elEstimateBar.style.width = `${pct.toFixed(1)}%`;

        // KEPCO Industrial Rates UI
        updateKepcoRatesUI();

        // Weather UI updates
        const txtTempPaju = document.getElementById('weather-temp-paju');
        const txtHumiPaju = document.getElementById('weather-humi-paju');
        const barHumiPaju = document.getElementById('weather-humi-bar-paju');
        const txtWetbulbPaju = document.getElementById('weather-wetbulb-paju');
        const txtDewpointPaju = document.getElementById('weather-dewpoint-paju');
        const txtStatusPaju = document.getElementById('weather-status-text-paju');
        const iconPaju = document.getElementById('weather-icon-paju');

        const txtTempGumi = document.getElementById('weather-temp-gumi');
        const txtHumiGumi = document.getElementById('weather-humi-gumi');
        const barHumiGumi = document.getElementById('weather-humi-bar-gumi');
        const txtWetbulbGumi = document.getElementById('weather-wetbulb-gumi');
        const txtDewpointGumi = document.getElementById('weather-dewpoint-gumi');
        const txtStatusGumi = document.getElementById('weather-status-text-gumi');
        const iconGumi = document.getElementById('weather-icon-gumi');

        const txtTempGuangzhou = document.getElementById('weather-temp-guangzhou');
        const txtHumiGuangzhou = document.getElementById('weather-humi-guangzhou');
        const barHumiGuangzhou = document.getElementById('weather-humi-bar-guangzhou');
        const txtWetbulbGuangzhou = document.getElementById('weather-wetbulb-guangzhou');
        const txtDewpointGuangzhou = document.getElementById('weather-dewpoint-guangzhou');
        const txtStatusGuangzhou = document.getElementById('weather-status-text-guangzhou');
        const iconGuangzhou = document.getElementById('weather-icon-guangzhou');

        const txtTempHaiphong = document.getElementById('weather-temp-haiphong');
        const txtHumiHaiphong = document.getElementById('weather-humi-haiphong');
        const barHumiHaiphong = document.getElementById('weather-humi-bar-haiphong');
        const txtWetbulbHaiphong = document.getElementById('weather-wetbulb-haiphong');
        const txtDewpointHaiphong = document.getElementById('weather-dewpoint-haiphong');
        const txtStatusHaiphong = document.getElementById('weather-status-text-haiphong');
        const iconHaiphong = document.getElementById('weather-icon-haiphong');

        if (txtTempPaju) txtTempPaju.textContent = livePajuTemp.toFixed(1);
        if (txtHumiPaju) txtHumiPaju.textContent = Math.round(livePajuHumi);
        if (barHumiPaju) barHumiPaju.style.width = `${Math.round(livePajuHumi)}%`;
        if (txtWetbulbPaju) txtWetbulbPaju.textContent = calculateWetBulb(livePajuTemp, livePajuHumi).toFixed(1);
        if (txtDewpointPaju) txtDewpointPaju.textContent = calculateDewPoint(livePajuTemp, livePajuHumi).toFixed(1);
        
        if (txtTempGumi) txtTempGumi.textContent = liveGumiTemp.toFixed(1);
        if (txtHumiGumi) txtHumiGumi.textContent = Math.round(liveGumiHumi);
        if (barHumiGumi) barHumiGumi.style.width = `${Math.round(liveGumiHumi)}%`;
        if (txtWetbulbGumi) txtWetbulbGumi.textContent = calculateWetBulb(liveGumiTemp, liveGumiHumi).toFixed(1);
        if (txtDewpointGumi) txtDewpointGumi.textContent = calculateDewPoint(liveGumiTemp, liveGumiHumi).toFixed(1);

        if (txtTempGuangzhou) txtTempGuangzhou.textContent = liveGuangzhouTemp.toFixed(1);
        if (txtHumiGuangzhou) txtHumiGuangzhou.textContent = Math.round(liveGuangzhouHumi);
        if (barHumiGuangzhou) barHumiGuangzhou.style.width = `${Math.round(liveGuangzhouHumi)}%`;
        if (txtWetbulbGuangzhou) txtWetbulbGuangzhou.textContent = calculateWetBulb(liveGuangzhouTemp, liveGuangzhouHumi).toFixed(1);
        if (txtDewpointGuangzhou) txtDewpointGuangzhou.textContent = calculateDewPoint(liveGuangzhouTemp, liveGuangzhouHumi).toFixed(1);

        if (txtTempHaiphong) txtTempHaiphong.textContent = liveHaiphongTemp.toFixed(1);
        if (txtHumiHaiphong) txtHumiHaiphong.textContent = Math.round(liveHaiphongHumi);
        if (barHumiHaiphong) barHumiHaiphong.style.width = `${Math.round(liveHaiphongHumi)}%`;
        if (txtWetbulbHaiphong) txtWetbulbHaiphong.textContent = calculateWetBulb(liveHaiphongTemp, liveHaiphongHumi).toFixed(1);
        if (txtDewpointHaiphong) txtDewpointHaiphong.textContent = calculateDewPoint(liveHaiphongTemp, liveHaiphongHumi).toFixed(1);

        let lucideNeedsRefresh = false;

        const pajuStatus = getWeatherStatus(livePajuTemp, livePajuHumi);
        if (txtStatusPaju) txtStatusPaju.textContent = pajuStatus.text;
        if (iconPaju) {
            const currentIcon = iconPaju.querySelector('i')?.getAttribute('data-lucide');
            if (currentIcon !== pajuStatus.icon) {
                let iconColor = '#f59e0b';
                if (pajuStatus.icon === 'cloud-rain') iconColor = '#3b82f6';
                else if (pajuStatus.icon === 'cloud') iconColor = '#94a3b8';
                else if (pajuStatus.icon === 'cloud-sun') iconColor = '#f59e0b';
                iconPaju.style.color = iconColor;
                iconPaju.innerHTML = `<i data-lucide="${pajuStatus.icon}"></i>`;
                lucideNeedsRefresh = true;
            }
        }

        const gumiStatus = getWeatherStatus(liveGumiTemp, liveGumiHumi);
        if (txtStatusGumi) txtStatusGumi.textContent = gumiStatus.text;
        if (iconGumi) {
            const currentIcon = iconGumi.querySelector('i')?.getAttribute('data-lucide');
            if (currentIcon !== gumiStatus.icon) {
                let iconColor = '#f59e0b';
                if (gumiStatus.icon === 'cloud-rain') iconColor = '#3b82f6';
                else if (gumiStatus.icon === 'cloud') iconColor = '#94a3b8';
                else if (gumiStatus.icon === 'cloud-sun') iconColor = '#f59e0b';
                iconGumi.style.color = iconColor;
                iconGumi.innerHTML = `<i data-lucide="${gumiStatus.icon}"></i>`;
                lucideNeedsRefresh = true;
            }
        }

        const guangzhouStatus = getWeatherStatus(liveGuangzhouTemp, liveGuangzhouHumi);
        if (txtStatusGuangzhou) txtStatusGuangzhou.textContent = guangzhouStatus.text;
        if (iconGuangzhou) {
            const currentIcon = iconGuangzhou.querySelector('i')?.getAttribute('data-lucide');
            if (currentIcon !== guangzhouStatus.icon) {
                let iconColor = '#f59e0b';
                if (guangzhouStatus.icon === 'cloud-rain') iconColor = '#3b82f6';
                else if (guangzhouStatus.icon === 'cloud') iconColor = '#94a3b8';
                else if (guangzhouStatus.icon === 'cloud-sun') iconColor = '#f59e0b';
                iconGuangzhou.style.color = iconColor;
                iconGuangzhou.innerHTML = `<i data-lucide="${guangzhouStatus.icon}"></i>`;
                lucideNeedsRefresh = true;
            }
        }

        const haiphongStatus = getWeatherStatus(liveHaiphongTemp, liveHaiphongHumi);
        if (txtStatusHaiphong) txtStatusHaiphong.textContent = haiphongStatus.text;
        if (iconHaiphong) {
            const currentIcon = iconHaiphong.querySelector('i')?.getAttribute('data-lucide');
            if (currentIcon !== haiphongStatus.icon) {
                let iconColor = '#8b5cf6';
                if (haiphongStatus.icon === 'cloud-rain') iconColor = '#3b82f6';
                else if (haiphongStatus.icon === 'cloud') iconColor = '#94a3b8';
                else if (haiphongStatus.icon === 'cloud-sun') iconColor = '#8b5cf6';
                iconHaiphong.style.color = iconColor;
                iconHaiphong.innerHTML = `<i data-lucide="${haiphongStatus.icon}"></i>`;
                lucideNeedsRefresh = true;
            }
        }

        if (lucideNeedsRefresh && typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function updateKepcoRatesUI() {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const date = now.getDate();
        const hour = now.getHours();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;

        // Update the estimate date to the current date/time
        const elEstimateDate = document.querySelector('.estimate-date');
        if (elEstimateDate) {
            elEstimateDate.textContent = `${month}/${date} ${hour}시 정산 기준`;
        }

        // Auto-detect season if not manually selected yet
        if (selectedKepcoSeason === null) {
            if (month >= 6 && month <= 8) {
                selectedKepcoSeason = "summer";
            } else if (month === 11 || month === 12 || month === 1 || month === 2) {
                selectedKepcoSeason = "winter";
            } else {
                selectedKepcoSeason = "spring_autumn";
            }
        }

        // 1. Determine Season
        let season = selectedKepcoSeason;
        let seasonText = "봄·가을철";
        if (season === "summer") {
            seasonText = "여름철";
        } else if (season === "winter") {
            seasonText = "겨울철";
        }

        // Update season selector buttons active classes
        const btnSeasonSummer = document.getElementById('btn-season-summer');
        const btnSeasonWinter = document.getElementById('btn-season-winter');
        const btnSeasonSpringAutumn = document.getElementById('btn-season-springautumn');

        if (btnSeasonSummer) {
            if (season === 'summer') {
                btnSeasonSummer.classList.add('active');
                btnSeasonSummer.style.background = '#ffffff';
                btnSeasonSummer.style.color = 'var(--primary-green)';
            } else {
                btnSeasonSummer.classList.remove('active');
                btnSeasonSummer.style.background = 'transparent';
                btnSeasonSummer.style.color = 'var(--text-secondary)';
            }
        }
        if (btnSeasonWinter) {
            if (season === 'winter') {
                btnSeasonWinter.classList.add('active');
                btnSeasonWinter.style.background = '#ffffff';
                btnSeasonWinter.style.color = 'var(--primary-green)';
            } else {
                btnSeasonWinter.classList.remove('active');
                btnSeasonWinter.style.background = 'transparent';
                btnSeasonWinter.style.color = 'var(--text-secondary)';
            }
        }
        if (btnSeasonSpringAutumn) {
            if (season === 'spring_autumn') {
                btnSeasonSpringAutumn.classList.add('active');
                btnSeasonSpringAutumn.style.background = '#ffffff';
                btnSeasonSpringAutumn.style.color = 'var(--primary-green)';
            } else {
                btnSeasonSpringAutumn.classList.remove('active');
                btnSeasonSpringAutumn.style.background = 'transparent';
                btnSeasonSpringAutumn.style.color = 'var(--text-secondary)';
            }
        }

        // 2. Define Rates for each Season (산업용(을) 고압A 선택 I 기준)
        const rates = {
            summer: { offpeak: 126.2, midpeak: 178.7, peak: 242.7 },
            spring_autumn: { offpeak: 125.1, midpeak: 174.0, peak: 238.0 },
            winter: { offpeak: 125.1, midpeak: 172.9, peak: 236.9 }
        };

        const seasonRates = rates[season];

        // Update KEPCO rate table text contents
        const elPriceOffpeak = document.getElementById('kepco-price-offpeak');
        const elPriceMidpeak = document.getElementById('kepco-price-midpeak');
        const elPricePeak = document.getElementById('kepco-price-peak');
        if (elPriceOffpeak) elPriceOffpeak.textContent = seasonRates.offpeak.toFixed(1);
        if (elPriceMidpeak) elPriceMidpeak.textContent = seasonRates.midpeak.toFixed(1);
        if (elPricePeak) elPricePeak.textContent = seasonRates.peak.toFixed(1);

        // 3. Determine Load Period (based on 2026-04-16 KEPCO rules)
        // Off-peak (경부하): 22:00 ~ 08:00
        // Peak (최대부하): 15:00 ~ 21:00 (Weekdays)
        // Mid-peak (중간부하): 08:00 ~ 15:00, 21:00 ~ 22:00 (Weekdays)
        let period = "midpeak";
        let periodText = "중간부하";
        let pulseColor = "orange";
        
        if (hour >= 22 || hour < 8) {
            period = "offpeak";
            periodText = "경부하";
            pulseColor = "green";
        } else {
            if (isWeekend) {
                period = "midpeak";
                periodText = "중간부하 (주말)";
                pulseColor = "green";
            } else {
                if (hour >= 15 && hour < 21) {
                    period = "peak";
                    periodText = "최대부하";
                    pulseColor = "red";
                } else {
                    period = "midpeak";
                    periodText = "중간부하";
                    pulseColor = "orange";
                }
            }
        }

        const activePrice = seasonRates[period];

        // 4. Update UI Display
        const elActiveSeason = document.getElementById('kepco-active-season');
        const elActivePeriod = document.getElementById('kepco-active-period');
        const elActivePrice = document.getElementById('kepco-active-price');

        if (elActiveSeason) elActiveSeason.textContent = `${seasonText} 요금제 적용`;
        
        if (elActivePeriod) {
            elActivePeriod.innerHTML = `<span class="pulse-dot ${pulseColor}"></span> ${periodText} 적용 중`;
        }
        
        if (elActivePrice) elActivePrice.textContent = activePrice.toFixed(1);

        // Highlight active row in table
        const rowOffpeak = document.getElementById('rate-row-offpeak');
        const rowMidpeak = document.getElementById('rate-row-midpeak');
        const rowPeak = document.getElementById('rate-row-peak');

        if (rowOffpeak) rowOffpeak.classList.remove('active-rate-row');
        if (rowMidpeak) rowMidpeak.classList.remove('active-rate-row');
        if (rowPeak) rowPeak.classList.remove('active-rate-row');

        if (period === 'offpeak' && rowOffpeak) rowOffpeak.classList.add('active-rate-row');
        if (period === 'midpeak' && rowMidpeak) rowMidpeak.classList.add('active-rate-row');
        if (period === 'peak' && rowPeak) rowPeak.classList.add('active-rate-row');

        // Highlight active row in Gas tables
        const rowSeoulWinter = document.getElementById('seoul-gas-row-winter');
        const rowSeoulSummer = document.getElementById('seoul-gas-row-summer');
        const rowSeoulOther = document.getElementById('seoul-gas-row-other');
        const rowYeongnamWinter = document.getElementById('yeongnam-gas-row-winter');
        const rowYeongnamSummer = document.getElementById('yeongnam-gas-row-summer');
        const rowYeongnamOther = document.getElementById('yeongnam-gas-row-other');

        if (rowSeoulWinter) { rowSeoulWinter.className = ''; rowSeoulWinter.style.background = ''; rowSeoulWinter.style.borderLeft = ''; }
        if (rowSeoulSummer) { rowSeoulSummer.className = ''; rowSeoulSummer.style.background = ''; rowSeoulSummer.style.borderLeft = ''; }
        if (rowSeoulOther) { rowSeoulOther.className = ''; rowSeoulOther.style.background = ''; rowSeoulOther.style.borderLeft = ''; }
        if (rowYeongnamWinter) { rowYeongnamWinter.className = ''; rowYeongnamWinter.style.background = ''; rowYeongnamWinter.style.borderLeft = ''; }
        if (rowYeongnamSummer) { rowYeongnamSummer.className = ''; rowYeongnamSummer.style.background = ''; rowYeongnamSummer.style.borderLeft = ''; }
        if (rowYeongnamOther) { rowYeongnamOther.className = ''; rowYeongnamOther.style.background = ''; rowYeongnamOther.style.borderLeft = ''; }

        let activePriceSeoul = 22.2013;
        let activePriceYeongnam = 23.3427;
        let activeSeasonText = "기타월";

        if (season === 'summer') {
            if (rowSeoulSummer) {
                rowSeoulSummer.classList.add('active-rate-row');
                rowSeoulSummer.style.background = 'rgba(217, 119, 6, 0.08)';
                rowSeoulSummer.style.borderLeft = '3px solid #d97706';
            }
            if (rowYeongnamSummer) {
                rowYeongnamSummer.classList.add('active-rate-row');
                rowYeongnamSummer.style.background = 'rgba(234, 88, 12, 0.08)';
                rowYeongnamSummer.style.borderLeft = '3px solid #ea580c';
            }
            activePriceSeoul = 22.2013;
            activePriceYeongnam = 23.3427;
            activeSeasonText = "하절기";
        } else if (season === 'winter') {
            if (rowSeoulWinter) {
                rowSeoulWinter.classList.add('active-rate-row');
                rowSeoulWinter.style.background = 'rgba(217, 119, 6, 0.08)';
                rowSeoulWinter.style.borderLeft = '3px solid #d97706';
            }
            if (rowYeongnamWinter) {
                rowYeongnamWinter.classList.add('active-rate-row');
                rowYeongnamWinter.style.background = 'rgba(234, 88, 12, 0.08)';
                rowYeongnamWinter.style.borderLeft = '3px solid #ea580c';
            }
            activePriceSeoul = 22.2013;
            activePriceYeongnam = 23.3427;
            activeSeasonText = "동절기";
        } else {
            if (rowSeoulOther) {
                rowSeoulOther.classList.add('active-rate-row');
                rowSeoulOther.style.background = 'rgba(217, 119, 6, 0.08)';
                rowSeoulOther.style.borderLeft = '3px solid #d97706';
            }
            if (rowYeongnamOther) {
                rowYeongnamOther.classList.add('active-rate-row');
                rowYeongnamOther.style.background = 'rgba(234, 88, 12, 0.08)';
                rowYeongnamOther.style.borderLeft = '3px solid #ea580c';
            }
            activePriceSeoul = 22.2013;
            activePriceYeongnam = 23.3427;
            activeSeasonText = "기타월";
        }

        const elActiveSeasonSeoul = document.getElementById('gas-active-season-seoul');
        const elActiveSeasonYeongnam = document.getElementById('gas-active-season-yeongnam');
        const elActivePriceSeoul = document.getElementById('gas-active-price-seoul');
        const elActivePriceYeongnam = document.getElementById('gas-active-price-yeongnam');

        if (elActiveSeasonSeoul) elActiveSeasonSeoul.textContent = `${activeSeasonText} 요금제 적용`;
        if (elActiveSeasonYeongnam) elActiveSeasonYeongnam.textContent = `${activeSeasonText} 요금제 적용`;
        if (elActivePriceSeoul) elActivePriceSeoul.textContent = activePriceSeoul.toFixed(4);
        if (elActivePriceYeongnam) elActivePriceYeongnam.textContent = activePriceYeongnam.toFixed(4);
    }

    // ==========================================================================
    // 9. Chart.js Graphs (Safety Trends)
    // ==========================================================================
    let safetyChartInstance = null;

    function initSafetyChart() {
        const ctx = document.getElementById('safety-trend-chart');
        if (!ctx || safetyChartInstance) return;

        const hours = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '실시간'];
        
        const safetyData = {
            labels: hours,
            datasets: [
                {
                    label: '종합 안전지수 (%)',
                    data: [98.2, 98.5, 99.0, 98.7, 98.9, 98.4, 98.8, 98.6],
                    borderColor: '#f97316',
                    borderWidth: 3,
                    backgroundColor: 'rgba(249, 115, 22, 0.05)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#f97316',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: '실내 쾌적도 지수 (%)',
                    data: [95.0, 95.8, 96.2, 96.0, 96.5, 96.1, 96.4, 96.3],
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.3,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        };

        safetyChartInstance = new Chart(ctx, {
            type: 'line',
            data: safetyData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Outfit', size: 12, weight: '500' },
                            color: '#475569'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#475569',
                        borderColor: 'rgba(249, 115, 22, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        titleFont: { family: 'Outfit', weight: '700' },
                        bodyFont: { family: 'Outfit' }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Outfit', size: 12, weight: '500' },
                            color: '#475569'
                        }
                    },
                    y: {
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: {
                            font: { family: 'Outfit', size: 11 },
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    // ==========================================================================
    // 10. Live Safety Simulation Engine
    // ==========================================================================
    let safetySimInterval = null;
    let safetyClockInterval = null;
    
    let liveSafety = 98.6;
    let liveOxygen = 20.9;
    let liveGas = 0;
    let liveOccupant = 48;
    
    // Safety Accumulative Time
    let safetyAccDays = 412;
    let safetyAccHours = 9888;
    let safetyAccMinutes = 24;
    let safetyAccSeconds = 35;

    function startSafetySimulator() {
        if (safetySimInterval) return;
        
        // 1s Clock Timer for Safety Accumulative Time
        safetyClockInterval = setInterval(() => {
            safetyAccSeconds++;
            if (safetyAccSeconds >= 60) {
                safetyAccSeconds = 0;
                safetyAccMinutes++;
                if (safetyAccMinutes >= 60) {
                    safetyAccMinutes = 0;
                    safetyAccHours++;
                    if (safetyAccHours % 24 === 0) {
                        safetyAccDays++;
                    }
                }
            }
            updateSafetyClockUI();
        }, 1000);
        
        // 3s Fluctuation Simulation
        safetySimInterval = setInterval(() => {
            // Fluctuate Safety Index: 98.4% to 99.2%
            liveSafety += (Math.random() - 0.5) * 0.2;
            if (liveSafety < 98.0) liveSafety = 98.0;
            if (liveSafety > 99.5) liveSafety = 99.5;
            
            // Fluctuate Oxygen: 20.7% to 21.0%
            liveOxygen += (Math.random() - 0.5) * 0.05;
            if (liveOxygen < 20.5) liveOxygen = 20.5;
            if (liveOxygen > 21.2) liveOxygen = 21.2;
            
            // Fluctuate Gas: 0 to 1 ppm
            if (Math.random() > 0.8) {
                liveGas = Math.random() > 0.5 ? 1 : 0;
            }
            
            // Fluctuate occupants: 45 to 52
            liveOccupant += Math.random() > 0.5 ? 1 : -1;
            if (liveOccupant < 40) liveOccupant = 40;
            if (liveOccupant > 55) liveOccupant = 55;

            // Update UI
            updateSafetyUI();
            
            // Update Live Chart point
            if (safetyChartInstance) {
                const datasets = safetyChartInstance.data.datasets;
                datasets[0].data[datasets[0].data.length - 1] = parseFloat(liveSafety.toFixed(1));
                datasets[1].data[datasets[1].data.length - 1] = parseFloat((liveSafety - 2.3 + Math.random() * 0.4).toFixed(1));
                safetyChartInstance.update('none');
            }

        }, 3000);
    }

    function stopSafetySimulator() {
        if (safetySimInterval) {
            clearInterval(safetySimInterval);
            safetySimInterval = null;
        }
        if (safetyClockInterval) {
            clearInterval(safetyClockInterval);
            safetyClockInterval = null;
        }
    }

    function updateSafetyClockUI() {
        const txtHours = document.getElementById('safety-hours-val');
        const txtSuffix = document.getElementById('safety-time-suffix');
        if (txtHours) {
            txtHours.textContent = safetyAccDays.toLocaleString();
        }
        if (txtSuffix) {
            txtSuffix.innerHTML = `일 연속 (실시간 누적: <strong>${safetyAccHours.toLocaleString()}시간 ${safetyAccMinutes}분 ${safetyAccSeconds}초</strong>)`;
        }
    }

    function updateSafetyUI() {
        const txtSafety = document.getElementById('live-safety-val');
        const barSafety = document.getElementById('live-safety-bar');
        const txtOxygen = document.getElementById('live-oxygen-val');
        const barOxygen = document.getElementById('live-oxygen-bar');
        const txtGas = document.getElementById('live-gas-val');
        const barGas = document.getElementById('live-gas-bar');
        const txtOccupant = document.getElementById('live-occupant-val');
        const barOccupant = document.getElementById('live-occupant-bar');

        if (txtSafety) txtSafety.textContent = liveSafety.toFixed(1);
        if (barSafety) barSafety.style.width = `${liveSafety}%`;
        
        if (txtOxygen) txtOxygen.textContent = liveOxygen.toFixed(1);
        if (barOxygen) barOxygen.style.width = `${((liveOxygen - 15) / 10) * 100}%`;
        
        if (txtGas) txtGas.textContent = liveGas;
        if (barGas) barGas.style.width = `${(liveGas / 10) * 100}%`;
        
        if (txtOccupant) txtOccupant.textContent = liveOccupant;
        if (barOccupant) barOccupant.style.width = `${(liveOccupant / 80) * 100}%`;
    }

    // ==========================================================================
    // 11. Chart.js Graphs (AX Trends)
    // ==========================================================================
    let axChartInstance = null;

    function initAxChart() {
        const ctx = document.getElementById('ax-trend-chart');
        if (!ctx || axChartInstance) return;

        const hours = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '실시간'];
        
        const axData = {
            labels: hours,
            datasets: [
                {
                    label: 'GPU 가동 부하율 (%)',
                    data: [78.2, 82.5, 85.0, 89.7, 84.9, 79.4, 88.8, 84.2],
                    borderColor: '#d946ef',
                    borderWidth: 3,
                    backgroundColor: 'rgba(217, 70, 239, 0.05)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#d946ef',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: '초당 AI 요청 부하 (req/s)',
                    data: [12.0, 15.8, 18.2, 22.0, 16.5, 14.1, 20.4, 18.5],
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.3,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        };

        axChartInstance = new Chart(ctx, {
            type: 'line',
            data: axData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Outfit', size: 12, weight: '500' },
                            color: '#475569'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#475569',
                        borderColor: 'rgba(217, 70, 239, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        titleFont: { family: 'Outfit', weight: '700' },
                        bodyFont: { family: 'Outfit' }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Outfit', size: 12, weight: '500' },
                            color: '#475569'
                        }
                    },
                    y: {
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: {
                            font: { family: 'Outfit', size: 11 },
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    // ==========================================================================
    // 12. Live AX Simulation Engine
    // ==========================================================================
    let axSimInterval = null;
    
    let liveGpu = 84.2;
    let liveQps = 18.5;
    let liveMem = 68.0;
    let liveInference = 148520;

    function startAxSimulator() {
        if (axSimInterval) return;
        
        axSimInterval = setInterval(() => {
            // Fluctuate GPU: 75% to 92%
            liveGpu += (Math.random() - 0.5) * 6;
            if (liveGpu < 70) liveGpu = 70;
            if (liveGpu > 95) liveGpu = 95;
            
            // Fluctuate QPS: 12 to 25req/s
            liveQps += (Math.random() - 0.5) * 4;
            if (liveQps < 10) liveQps = 10;
            if (liveQps > 30) liveQps = 30;
            
            // Fluctuate Memory: 65% to 75%
            liveMem += (Math.random() - 0.5) * 1.5;
            if (liveMem < 60) liveMem = 60;
            if (liveMem > 80) liveMem = 80;
            
            // Increment Inferences
            liveInference += Math.floor(Math.random() * 20) + 15;

            // Update UI
            updateAxUI();
            
            // Update Live Chart point
            if (axChartInstance) {
                const datasets = axChartInstance.data.datasets;
                datasets[0].data[datasets[0].data.length - 1] = parseFloat(liveGpu.toFixed(1));
                datasets[1].data[datasets[1].data.length - 1] = parseFloat(liveQps.toFixed(1));
                axChartInstance.update('none');
            }

        }, 3000);
    }

    function stopAxSimulator() {
        if (axSimInterval) {
            clearInterval(axSimInterval);
            axSimInterval = null;
        }
    }

    function updateAxUI() {
        const txtGpu = document.getElementById('live-gpu-val');
        const barGpu = document.getElementById('live-gpu-bar');
        const txtQps = document.getElementById('live-qps-val');
        const barQps = document.getElementById('live-qps-bar');
        const txtMem = document.getElementById('live-mem-val');
        const barMem = document.getElementById('live-mem-bar');
        const txtInference = document.getElementById('live-inference-val');
        const barInference = document.getElementById('live-inference-bar');

        if (txtGpu) txtGpu.textContent = liveGpu.toFixed(1);
        if (barGpu) barGpu.style.width = `${liveGpu}%`;
        
        if (txtQps) txtQps.textContent = liveQps.toFixed(1);
        if (barQps) barQps.style.width = `${(liveQps / 30) * 100}%`;
        
        if (txtMem) txtMem.textContent = liveMem.toFixed(1);
        if (barMem) barMem.style.width = `${liveMem}%`;
        
        if (txtInference) txtInference.textContent = liveInference.toLocaleString();
        if (barInference) barInference.style.width = `${((liveInference - 148520) / 5000 + 78)}%`;
    }

    // ==========================================================================
    // 8.5 Utility Future Outlook Chart
    // ==========================================================================
    let utilityOutlookChartInstance = null;

    function initUtilityOutlookChart() {
        const ctx = document.getElementById('utility-outlook-chart');
        if (!ctx || utilityOutlookChartInstance) return;

        utilityOutlookChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['6월 (당월)', '7월', '8월', '9월', '10월', '11월'],
                datasets: [
                    {
                        label: '전기 요금 전망',
                        data: [412, 585, 620, 435, 395, 445],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.04)',
                        borderWidth: 3,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.35,
                        fill: true
                    },
                    {
                        label: '도시가스 요금 전망',
                        data: [120, 95, 91, 115, 185, 320],
                        borderColor: '#ea580c',
                        backgroundColor: 'rgba(234, 88, 12, 0.04)',
                        borderWidth: 3,
                        pointBackgroundColor: '#ea580c',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.35,
                        fill: true
                    },
                    {
                        label: '수도 요금 전망',
                        data: [44, 49, 51, 45, 43, 42],
                        borderColor: '#0d9488',
                        backgroundColor: 'rgba(13, 148, 136, 0.04)',
                        borderWidth: 3,
                        pointBackgroundColor: '#0d9488',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.35,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Noto Sans KR', size: 10, weight: '700' },
                            color: '#475569',
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#475569',
                        borderColor: 'rgba(16, 185, 129, 0.15)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 12,
                        titleFont: { family: 'Noto Sans KR', weight: '700', size: 11 },
                        bodyFont: { family: 'Noto Sans KR', size: 10 },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toLocaleString() + ' 만원';
                                    const krw = context.parsed.y * 10000;
                                    label += ` (${krw.toLocaleString()} 원)`;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Noto Sans KR', size: 10, weight: '600' },
                            color: '#475569'
                        }
                    },
                    y: {
                        grid: { color: 'rgba(226, 232, 240, 0.5)' },
                        title: {
                            display: true,
                            text: '예상 요금 (단위: 만원)',
                            font: { family: 'Noto Sans KR', size: 10, weight: '700' },
                            color: '#475569'
                        },
                        ticks: {
                            font: { family: 'Outfit', size: 9 },
                            color: '#94a3b8',
                            callback: function(value) {
                                return value.toLocaleString() + ' 만원';
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================================================
    // 9. Weather Forecast Comparison Chart and Helper Logic
    // ==========================================================================
    let weatherChartInstance = null;

    function getWeatherStatus(temp, humi) {
        if (humi > 80) return { text: "비", icon: "cloud-rain" };
        if (humi > 72) return { text: "흐림", icon: "cloud" };
        if (humi > 63) return { text: "구름 조금", icon: "cloud-sun" };
        return { text: "맑음", icon: "sun" };
    }

    function calculateWetBulb(temp, humi) {
        const T = temp;
        const RH = humi;
        const tw = T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) 
                 + Math.atan(T + RH) 
                 - Math.atan(RH - 1.676331) 
                 + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) 
                 - 4.686035;
        return parseFloat(tw.toFixed(1));
    }

    function calculateDewPoint(temp, humi) {
        const a = 17.625;
        const b = 243.04;
        const alpha = ((a * temp) / (b + temp)) + Math.log(humi / 100.0);
        const dp = (b * alpha) / (a - alpha);
        return parseFloat(dp.toFixed(1));
    }

    function initWeatherChart() {
        const ctx = document.getElementById('weather-forecast-chart');
        if (!ctx || weatherChartInstance) return;

        const hoursLabels = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        const hoursValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
        
        const pajuTempData = hoursValues.map(h => parseFloat((23.0 + 5.0 * Math.sin((h - 8) * Math.PI / 12)).toFixed(1)));
        const pajuHumiData = hoursValues.map(h => parseFloat((72.5 - 12.5 * Math.sin((h - 8) * Math.PI / 12)).toFixed(1)));
        const gumiTempData = hoursValues.map(h => parseFloat((24.5 + 5.0 * Math.sin((h - 8) * Math.PI / 12)).toFixed(1)));
        const gumiHumiData = hoursValues.map(h => parseFloat((67.5 - 12.5 * Math.sin((h - 8) * Math.PI / 12)).toFixed(1)));
        const guangzhouTempData = hoursValues.map(h => parseFloat((30.0 + 4.0 * Math.sin((h - 8) * Math.PI / 12)).toFixed(1)));
        const guangzhouHumiData = hoursValues.map(h => parseFloat((80.0 - 10.0 * Math.sin((h - 8) * Math.PI / 12)).toFixed(1)));
        const haiphongTempData = hoursValues.map(h => parseFloat((29.5 + 3.5 * Math.sin((h - 8) * Math.PI / 12)).toFixed(1)));
        const haiphongHumiData = hoursValues.map(h => parseFloat((85.0 - 10.0 * Math.sin((h - 8) * Math.PI / 12)).toFixed(1)));

        const weatherData = {
            labels: hoursLabels,
            datasets: [
                {
                    label: '파주 기온 (°C)',
                    data: pajuTempData,
                    borderColor: '#10b981',
                    borderWidth: 2.5,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: '파주 습도 (%)',
                    data: pajuHumiData,
                    borderColor: '#14b8a6',
                    borderWidth: 2.0,
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#14b8a6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.0,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    yAxisID: 'y1'
                },
                {
                    label: '구미 기온 (°C)',
                    data: gumiTempData,
                    borderColor: '#3b82f6',
                    borderWidth: 2.5,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: '구미 습도 (%)',
                    data: gumiHumiData,
                    borderColor: '#60a5fa',
                    borderWidth: 2.0,
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#60a5fa',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.0,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    yAxisID: 'y1'
                },
                {
                    label: '광저우 기온 (°C)',
                    data: guangzhouTempData,
                    borderColor: '#ef4444',
                    borderWidth: 2.5,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: '광저우 습도 (%)',
                    data: guangzhouHumiData,
                    borderColor: '#f87171',
                    borderWidth: 2.0,
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#f87171',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.0,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    yAxisID: 'y1'
                },
                {
                    label: '하이퐁 기온 (°C)',
                    data: haiphongTempData,
                    borderColor: '#8b5cf6',
                    borderWidth: 2.5,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: '하이퐁 습도 (%)',
                    data: haiphongHumiData,
                    borderColor: '#a78bfa',
                    borderWidth: 2.0,
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#a78bfa',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.0,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    yAxisID: 'y1'
                }
            ]
        };

        weatherChartInstance = new Chart(ctx, {
            type: 'line',
            data: weatherData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Outfit', size: 10, weight: '600' },
                            color: '#475569',
                            boxWidth: 12,
                            padding: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#475569',
                        borderColor: 'rgba(16, 185, 129, 0.2)',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 10,
                        titleFont: { family: 'Outfit', weight: '700' },
                        bodyFont: { family: 'Outfit' },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y;
                                    if (context.dataset.yAxisID === 'y') {
                                        label += '°C';
                                    } else {
                                        label += '%';
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Outfit', size: 10, weight: '500' },
                            color: '#475569',
                            autoSkip: true,
                            maxTicksLimit: 13,
                            maxRotation: 0,
                            minRotation: 0
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        grid: { color: 'rgba(226, 232, 240, 0.5)' },
                        title: {
                            display: true,
                            text: '기온 (°C)',
                            font: { family: 'Outfit', size: 10, weight: '700' },
                            color: '#475569'
                        },
                        ticks: {
                            font: { family: 'Outfit', size: 10 },
                            color: '#94a3b8',
                            callback: function(value) {
                                return value + '°C';
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        grid: { display: false },
                        title: {
                            display: true,
                            text: '습도 (%)',
                            font: { family: 'Outfit', size: 10, weight: '700' },
                            color: '#475569'
                        },
                        ticks: {
                            font: { family: 'Outfit', size: 10 },
                            color: '#94a3b8',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    function initDailyForecast() {
        const containerPaju = document.getElementById('weather-forecast-list-paju');
        const containerGumi = document.getElementById('weather-forecast-list-gumi');
        const containerGuangzhou = document.getElementById('weather-forecast-list-guangzhou');
        const containerHaiphong = document.getElementById('weather-forecast-list-haiphong');
        if (!containerPaju || !containerGumi || !containerGuangzhou || !containerHaiphong) return;

        // Clear previous list if any
        containerPaju.innerHTML = '';
        containerGumi.innerHTML = '';
        containerGuangzhou.innerHTML = '';
        containerHaiphong.innerHTML = '';

        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        
        // Define weather forecast data structures
        const pajuForecast = [
            { status: "맑음", icon: "sun", iconColor: "#f59e0b", temp: "18 ~ 28°C", humi: "65%" },
            { status: "구름 조금", icon: "cloud-sun", iconColor: "#f59e0b", temp: "19 ~ 29°C", humi: "68%" },
            { status: "흐림", icon: "cloud", iconColor: "#94a3b8", temp: "20 ~ 27°C", humi: "75%" },
            { status: "비", icon: "cloud-rain", iconColor: "#3b82f6", temp: "18 ~ 24°C", humi: "85%" },
            { status: "구름 조금", icon: "cloud-sun", iconColor: "#f59e0b", temp: "19 ~ 26°C", humi: "70%" }
        ];

        const gumiForecast = [
            { status: "맑음", icon: "sun", iconColor: "#f59e0b", temp: "20 ~ 30°C", humi: "60%" },
            { status: "구름 조금", icon: "cloud-sun", iconColor: "#f59e0b", temp: "21 ~ 31°C", humi: "63%" },
            { status: "흐림", icon: "cloud", iconColor: "#94a3b8", temp: "22 ~ 29°C", humi: "70%" },
            { status: "비", icon: "cloud-rain", iconColor: "#3b82f6", temp: "20 ~ 26°C", humi: "80%" },
            { status: "구름 조금", icon: "cloud-sun", iconColor: "#f59e0b", temp: "21 ~ 28°C", humi: "65%" }
        ];

        const guangzhouForecast = [
            { status: "비", icon: "cloud-rain", iconColor: "#3b82f6", temp: "25 ~ 31°C", humi: "82%" },
            { status: "비", icon: "cloud-rain", iconColor: "#3b82f6", temp: "26 ~ 32°C", humi: "85%" },
            { status: "흐림", icon: "cloud", iconColor: "#94a3b8", temp: "27 ~ 33°C", humi: "78%" },
            { status: "구름 조금", icon: "cloud-sun", iconColor: "#f59e0b", temp: "28 ~ 34°C", humi: "70%" },
            { status: "맑음", icon: "sun", iconColor: "#f59e0b", temp: "27 ~ 35°C", humi: "65%" }
        ];

        const haiphongForecast = [
            { status: "비", icon: "cloud-rain", iconColor: "#3b82f6", temp: "26 ~ 32°C", humi: "85%" },
            { status: "흐림", icon: "cloud", iconColor: "#94a3b8", temp: "27 ~ 33°C", humi: "80%" },
            { status: "비", icon: "cloud-rain", iconColor: "#3b82f6", temp: "26 ~ 31°C", humi: "88%" },
            { status: "구름 조금", icon: "cloud-sun", iconColor: "#8b5cf6", temp: "28 ~ 34°C", humi: "75%" },
            { status: "맑음", icon: "sun", iconColor: "#8b5cf6", temp: "28 ~ 35°C", humi: "70%" }
        ];

        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i + 1); // tomorrow onwards
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const dayName = dayNames[date.getDay()];
            const dateStr = `${month}/${day} (${dayName})`;

            // Paju item
            const pData = pajuForecast[i];
            const pRow = document.createElement('div');
            pRow.className = 'forecast-row';
            pRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.75rem; border-radius: 10px; background: rgba(0,0,0,0.02); font-size: 0.8rem; border: 1px solid transparent; transition: background 0.2s; cursor: default;';
            pRow.onmouseover = () => { pRow.style.background = 'rgba(16, 185, 129, 0.05)'; pRow.style.borderColor = 'rgba(16, 185, 129, 0.15)'; };
            pRow.onmouseout = () => { pRow.style.background = 'rgba(0,0,0,0.02)'; pRow.style.borderColor = 'transparent'; };
            pRow.innerHTML = `
                <span style="font-weight: 700; color: var(--text-secondary); width: 80px;">${dateStr}</span>
                <div style="display: flex; align-items: center; gap: 0.4rem; width: 95px;">
                    <i data-lucide="${pData.icon}" style="width: 15px; height: 15px; color: ${pData.iconColor};"></i>
                    <span style="font-weight: 700; color: var(--text-primary);">${pData.status}</span>
                </div>
                <span style="font-weight: 800; color: var(--text-primary); text-align: right; width: 105px;">${pData.temp}</span>
                <span style="font-weight: 700; color: #10b981; text-align: right; width: 65px;">${pData.humi}</span>
            `;
            containerPaju.appendChild(pRow);

            // Gumi item
            const gData = gumiForecast[i];
            const gRow = document.createElement('div');
            gRow.className = 'forecast-row';
            gRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.75rem; border-radius: 10px; background: rgba(0,0,0,0.02); font-size: 0.8rem; border: 1px solid transparent; transition: background 0.2s; cursor: default;';
            gRow.onmouseover = () => { gRow.style.background = 'rgba(59, 130, 246, 0.05)'; gRow.style.borderColor = 'rgba(59, 130, 246, 0.15)'; };
            gRow.onmouseout = () => { gRow.style.background = 'rgba(0,0,0,0.02)'; gRow.style.borderColor = 'transparent'; };
            gRow.innerHTML = `
                <span style="font-weight: 700; color: var(--text-secondary); width: 80px;">${dateStr}</span>
                <div style="display: flex; align-items: center; gap: 0.4rem; width: 95px;">
                    <i data-lucide="${gData.icon}" style="width: 15px; height: 15px; color: ${gData.iconColor};"></i>
                    <span style="font-weight: 700; color: var(--text-primary);">${gData.status}</span>
                </div>
                <span style="font-weight: 800; color: var(--text-primary); text-align: right; width: 105px;">${gData.temp}</span>
                <span style="font-weight: 700; color: #3b82f6; text-align: right; width: 65px;">${gData.humi}</span>
            `;
            containerGumi.appendChild(gRow);

            // Guangzhou item
            const gzData = guangzhouForecast[i];
            const gzRow = document.createElement('div');
            gzRow.className = 'forecast-row';
            gzRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.75rem; border-radius: 10px; background: rgba(0,0,0,0.02); font-size: 0.8rem; border: 1px solid transparent; transition: background 0.2s; cursor: default;';
            gzRow.onmouseover = () => { gzRow.style.background = 'rgba(239, 68, 68, 0.05)'; gzRow.style.borderColor = 'rgba(239, 68, 68, 0.15)'; };
            gzRow.onmouseout = () => { gzRow.style.background = 'rgba(0,0,0,0.02)'; gzRow.style.borderColor = 'transparent'; };
            gzRow.innerHTML = `
                <span style="font-weight: 700; color: var(--text-secondary); width: 80px;">${dateStr}</span>
                <div style="display: flex; align-items: center; gap: 0.4rem; width: 95px;">
                    <i data-lucide="${gzData.icon}" style="width: 15px; height: 15px; color: ${gzData.iconColor};"></i>
                    <span style="font-weight: 700; color: var(--text-primary);">${gzData.status}</span>
                </div>
                <span style="font-weight: 800; color: var(--text-primary); text-align: right; width: 105px;">${gzData.temp}</span>
                <span style="font-weight: 700; color: #ef4444; text-align: right; width: 65px;">${gzData.humi}</span>
            `;
            containerGuangzhou.appendChild(gzRow);

            // Haiphong item
            const hpData = haiphongForecast[i];
            const hpRow = document.createElement('div');
            hpRow.className = 'forecast-row';
            hpRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.75rem; border-radius: 10px; background: rgba(0,0,0,0.02); font-size: 0.8rem; border: 1px solid transparent; transition: background 0.2s; cursor: default;';
            hpRow.onmouseover = () => { hpRow.style.background = 'rgba(139, 92, 246, 0.05)'; hpRow.style.borderColor = 'rgba(139, 92, 246, 0.15)'; };
            hpRow.onmouseout = () => { hpRow.style.background = 'rgba(0,0,0,0.02)'; hpRow.style.borderColor = 'transparent'; };
            hpRow.innerHTML = `
                <span style="font-weight: 700; color: var(--text-secondary); width: 80px;">${dateStr}</span>
                <div style="display: flex; align-items: center; gap: 0.4rem; width: 95px;">
                    <i data-lucide="${hpData.icon}" style="width: 15px; height: 15px; color: ${hpData.iconColor};"></i>
                    <span style="font-weight: 700; color: var(--text-primary);">${hpData.status}</span>
                </div>
                <span style="font-weight: 800; color: var(--text-primary); text-align: right; width: 105px;">${hpData.temp}</span>
                <span style="font-weight: 700; color: #8b5cf6; text-align: right; width: 65px;">${hpData.humi}</span>
            `;
            containerHaiphong.appendChild(hpRow);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
});
