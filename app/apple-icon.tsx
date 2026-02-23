import { ImageResponse } from 'next/og'

export const size = {
    width: 180,
    height: 180,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1A1A1A',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* inner circle */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '68px',
                            height: '68px',
                            borderRadius: '50%',
                            backgroundColor: '#FF5700',
                        }}
                    />
                    {/* outer circle */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '112px',
                            height: '112px',
                            borderRadius: '50%',
                            borderStyle: 'solid',
                            borderWidth: '11px',
                            borderColor: 'rgba(255, 87, 0, 0.3)',
                        }}
                    />
                </div>
            </div>
        ),
        { ...size }
    )
}
