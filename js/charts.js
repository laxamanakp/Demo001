// ============================================================
// My Hub Cares - Chart & Graph Utilities
// ============================================================

const Charts = {
    // Generate a bar chart using SVG
    generateBarChart(data, options = {}) {
        const {
            width = 600,
            height = 300,
            barColor = '#2563eb',
            labelColor = '#1f2937',
            showGrid = true,
            yMax = null,
            xLabels = [],
            title = ''
        } = options;

        const maxValue = yMax || Math.max(...data.map(d => d.value));
        const barWidth = (width - 80) / data.length;
        const chartHeight = height - 60;
        const padding = 40;

        let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">
            ${title ? `<text x="${width/2}" y="20" text-anchor="middle" font-size="16" font-weight="600" fill="${labelColor}">${title}</text>` : ''}
            ${showGrid ? this.generateGridLines(width, height, padding, maxValue, data.length) : ''}
            ${data.map((item, index) => {
                const barHeight = (item.value / maxValue) * chartHeight;
                const x = padding + (index * barWidth) + (barWidth * 0.1);
                const y = height - padding - barHeight;
                const label = xLabels[index] || item.label || '';
                
                return `
                    <rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="${barColor}" rx="4">
                        <title>${item.label || ''}: ${item.value}</title>
                    </rect>
                    <text x="${x + barWidth * 0.4}" y="${y - 5}" text-anchor="middle" font-size="12" fill="${labelColor}">${item.value}</text>
                    ${label ? `<text x="${x + barWidth * 0.4}" y="${height - padding + 20}" text-anchor="middle" font-size="11" fill="${labelColor}" transform="rotate(-45 ${x + barWidth * 0.4} ${height - padding + 20})">${label}</text>` : ''}
                `;
            }).join('')}
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="${labelColor}" stroke-width="2"/>
            <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="${labelColor}" stroke-width="2"/>
        </svg>`;

        return svg;
    },

    // Generate a line chart using SVG
    generateLineChart(data, options = {}) {
        const {
            width = 600,
            height = 300,
            lineColor = '#2563eb',
            fillColor = '#eff6ff',
            labelColor = '#1f2937',
            showPoints = true,
            yMax = null,
            xLabels = [],
            title = ''
        } = options;

        const maxValue = yMax || Math.max(...data.map(d => d.value));
        const chartWidth = width - 80;
        const chartHeight = height - 60;
        const padding = 40;
        const xStep = chartWidth / (data.length - 1 || 1);

        const points = data.map((item, index) => {
            const x = padding + (index * xStep);
            const y = padding + chartHeight - ((item.value / maxValue) * chartHeight);
            return { x, y, value: item.value, label: xLabels[index] || item.label || '' };
        });

        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const fillPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

        let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">
            ${title ? `<text x="${width/2}" y="20" text-anchor="middle" font-size="16" font-weight="600" fill="${labelColor}">${title}</text>` : ''}
            ${this.generateGridLines(width, height, padding, maxValue, data.length)}
            <path d="${fillPath}" fill="${fillColor}" opacity="0.5"/>
            <path d="${pathData}" stroke="${lineColor}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            ${showPoints ? points.map(p => `
                <circle cx="${p.x}" cy="${p.y}" r="5" fill="${lineColor}" stroke="white" stroke-width="2">
                    <title>${p.label}: ${p.value}</title>
                </circle>
            `).join('') : ''}
            ${points.map(p => p.label ? `
                <text x="${p.x}" y="${height - padding + 20}" text-anchor="middle" font-size="11" fill="${labelColor}" transform="rotate(-45 ${p.x} ${height - padding + 20})">${p.label}</text>
            ` : '').join('')}
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="${labelColor}" stroke-width="2"/>
            <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="${labelColor}" stroke-width="2"/>
        </svg>`;

        return svg;
    },

    // Generate a pie chart using SVG
    generatePieChart(data, options = {}) {
        const {
            width = 300,
            height = 300,
            radius = 100,
            colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
            showLegend = true,
            title = ''
        } = options;

        const total = data.reduce((sum, item) => sum + item.value, 0);
        const centerX = width / 2;
        const centerY = height / 2;
        let currentAngle = -90;

        const segments = data.map((item, index) => {
            const percentage = item.value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = centerX + radius * Math.cos(startAngle * Math.PI / 180);
            const y1 = centerY + radius * Math.sin(startAngle * Math.PI / 180);
            const x2 = centerX + radius * Math.cos(endAngle * Math.PI / 180);
            const y2 = centerY + radius * Math.sin(endAngle * Math.PI / 180);
            const largeArc = angle > 180 ? 1 : 0;

            const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            currentAngle += angle;

            return {
                path: pathData,
                color: colors[index % colors.length],
                label: item.label,
                value: item.value,
                percentage: (percentage * 100).toFixed(1)
            };
        });

        const legendItems = segments.map((seg, index) => {
            const legendY = index * 25 + 40;
            return `
                <rect x="${width + 20}" y="${legendY}" width="15" height="15" fill="${seg.color}"/>
                <text x="${width + 45}" y="${legendY + 12}" font-size="12" fill="#1f2937">${seg.label} (${seg.percentage}%)</text>
            `;
        }).join('');

        let svg = `<svg width="${showLegend ? width + 250 : width}" height="${height}" style="background: white; border-radius: 8px;">
            ${title ? `<text x="${width/2}" y="20" text-anchor="middle" font-size="16" font-weight="600" fill="#1f2937">${title}</text>` : ''}
            ${segments.map((seg, index) => `
                <path d="${seg.path}" fill="${seg.color}" stroke="white" stroke-width="2">
                    <title>${seg.label}: ${seg.value} (${seg.percentage}%)</title>
                </path>
            `).join('')}
            <text x="${centerX}" y="${centerY + 5}" text-anchor="middle" font-size="14" font-weight="600" fill="#1f2937">Total</text>
            <text x="${centerX}" y="${centerY + 25}" text-anchor="middle" font-size="20" font-weight="700" fill="#2563eb">${total}</text>
            ${showLegend ? legendItems : ''}
        </svg>`;

        return svg;
    },

    // Generate grid lines for charts
    generateGridLines(width, height, padding, maxValue, dataPoints) {
        const gridLines = 5;
        const gridLinesHTML = [];
        
        for (let i = 0; i <= gridLines; i++) {
            const y = padding + ((height - padding * 2) / gridLines) * i;
            const value = maxValue - (maxValue / gridLines) * i;
            
            gridLinesHTML.push(`
                <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="2,2"/>
                <text x="${padding - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#6b7280">${Math.round(value)}</text>
            `);
        }
        
        return gridLinesHTML.join('');
    },

    // Generate a simple progress chart (for satisfaction surveys)
    generateProgressChart(data, options = {}) {
        const {
            width = 600,
            barHeight = 24,
            showValues = true
        } = options;

        return data.map(item => {
            const percentage = item.value;
            const color = item.color || '#2563eb';
            
            return `
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <strong style="font-size: 14px;">${item.label}</strong>
                        ${showValues ? `<span style="font-size: 14px; color: #6b7280;">${item.value}%</span>` : ''}
                    </div>
                    <div style="background: #f3f4f6; height: ${barHeight}px; border-radius: 6px; overflow: hidden;">
                        <div style="background: ${color}; width: ${percentage}%; height: 100%; transition: width 0.3s; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;">
                            ${showValues && percentage > 15 ? `<span style="color: white; font-size: 12px; font-weight: 600;">${percentage}%</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
};

